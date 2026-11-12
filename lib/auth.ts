import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import crypto from 'crypto';

async function generateReferralCode(name: string) {
  const base = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4) || 'USER';
  const randomStr = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${base}${randomStr}`;
}

async function handleReferral(newUserRef: any, newUser: any) {
  try {
    const cookieStore = await cookies();
    const refCode = cookieStore.get('staybuddy_ref')?.value;
    if (refCode && !newUser.referredBy) {
      const referrerSnapshot = await db.collection('users').where('referralCode', '==', refCode).limit(1).get();
      if (!referrerSnapshot.empty) {
        const referrerDoc = referrerSnapshot.docs[0];
        const referrer = referrerDoc.data();
        if (referrer.referralCount < 5 && referrerDoc.id !== newUserRef.id) {
          await newUserRef.update({ referredBy: referrerDoc.id });
        }
      }
    }
  } catch (error) {
    console.error('Error handling referral:', error);
  }
}

// Respect explicitly configured NEXTAUTH_URL (e.g. https://staybuddy.in), only fallback if missing or localhost
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes('localhost')) {
  if (process.env.VERCEL) {
    process.env.NEXTAUTH_URL = 'https://staybuddy.in';
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone Number',
      credentials: {
        phone: { label: 'Phone Number', type: 'text' },
        otp: { label: 'OTP Code', type: 'text' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error('Please enter your phone number and OTP');
        }

        if (credentials.otp !== '123456') {
          throw new Error('Invalid OTP Code. (Hint: Use 123456 for testing)');
        }

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('phone', '==', credentials.phone).limit(1).get();
        
        let userId;
        let userData;

        if (snapshot.empty) {
          const newUserData = {
            name: `User ${credentials.phone.slice(-4)}`,
            phone: credentials.phone,
            role: credentials.role || 'customer',
            isActive: true,
            partnerStatus: 'none',
            referralCode: await generateReferralCode(`User ${credentials.phone.slice(-4)}`),
            referralCount: 0,
            walletBalance: 0,
            createdAt: new Date(),
          };
          const newUserRef = await usersRef.add(newUserData);
          await handleReferral(newUserRef, newUserData);
          userId = newUserRef.id;
          userData = newUserData;
        } else {
          userId = snapshot.docs[0].id;
          userData = snapshot.docs[0].data();
        }

        const u = userData as any;
        if (!u.isActive) {
          throw new Error('Your account has been suspended. Contact support.');
        }

        return {
          id: userId,
          name: u.name,
          email: u.email,
          role: u.role,
          image: u.avatar,
          phone: u.phone,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const cookieStore = await cookies();
        const intendedRole = cookieStore.get('intended_role')?.value;
        const isPartnerLogin = intendedRole === 'partner';

        // Check if this Gmail belongs to an assigned StayBuddy Onboarding Staff
        let isOnboarderStaff = false;
        if (user.email) {
          try {
            const staffSnap = await db.collection('onboarding_staff')
              .where('email', '==', user.email.toLowerCase().trim())
              .where('status', '==', 'active')
              .limit(1)
              .get();
            isOnboarderStaff = !staffSnap.empty;
          } catch (_) {}
        }
        
        const usersRef = db.collection('users');
        const byGoogleId = await usersRef.where('googleId', '==', account.providerAccountId).limit(1).get();
        let existingUserDoc = byGoogleId.empty ? null : byGoogleId.docs[0];

        if (!existingUserDoc && user.email) {
          const byEmail = await usersRef.where('email', '==', user.email).limit(1).get();
          if (!byEmail.empty) existingUserDoc = byEmail.docs[0];
        }

        const resolvedRole = isOnboarderStaff ? 'onboarder' : (isPartnerLogin ? 'partner' : 'customer');
        const resolvedPartnerStatus = (isOnboarderStaff || isPartnerLogin) ? (isOnboarderStaff ? 'approved' : 'pending') : 'none';

        if (!existingUserDoc) {
          const newUserData = {
            name: user.name,
            email: user.email,
            googleId: account.providerAccountId,
            avatar: user.image,
            role: resolvedRole,
            partnerStatus: resolvedPartnerStatus,
            isOnboarder: isOnboarderStaff,
            isActive: true,
            referralCode: await generateReferralCode(user.name || 'USER'),
            referralCount: 0,
            walletBalance: 0,
            createdAt: new Date(),
          };
          const newUserRef = await usersRef.add(newUserData);
          await handleReferral(newUserRef, newUserData);
          user.id = newUserRef.id;
          (user as any).role = newUserData.role;
          (user as any).partnerStatus = newUserData.partnerStatus;
          (user as any).phone = (newUserData as any).phone;
        } else {
          const existingData = existingUserDoc.data();
          const updates: any = {};
          
          if (!existingData.googleId) updates.googleId = account.providerAccountId;
          
          if (isOnboarderStaff && existingData.role !== 'admin') {
            updates.role = 'onboarder';
            updates.partnerStatus = 'approved';
            updates.isOnboarder = true;
          } else if (isPartnerLogin && existingData.role === 'customer') {
            updates.role = 'partner';
            updates.partnerStatus = 'pending';
          }
          
          if (Object.keys(updates).length > 0) {
            await existingUserDoc.ref.update(updates);
            Object.assign(existingData, updates);
          }
          
          if (!existingData.isActive) return false;
          user.id = existingUserDoc.id;
          (user as any).role = existingData.role;
          (user as any).partnerStatus = existingData.partnerStatus;
          (user as any).isOnboarder = Boolean(existingData.isOnboarder || isOnboarderStaff || existingData.role === 'onboarder');
          (user as any).phone = existingData.phone;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.partnerStatus = (user as any).partnerStatus;
        token.isOnboarder = Boolean((user as any).isOnboarder || (user as any).role === 'onboarder');
        token.id = user.id;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).partnerStatus = token.partnerStatus;
        (session.user as any).isOnboarder = Boolean(token.isOnboarder || token.role === 'onboarder');
        (session.user as any).id = token.id;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 10 * 365 * 24 * 60 * 60, // 10 years - Never expire session while performing tasks
  },
  jwt: {
    maxAge: 10 * 365 * 24 * 60 * 60, // 10 years persistent JWT
  },
  secret: process.env.NEXTAUTH_SECRET,
};

