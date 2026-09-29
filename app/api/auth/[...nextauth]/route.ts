import NextAuth, { NextAuthOptions } from 'next-auth';
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
    const cookieStore = cookies();
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

        if (!userData.isActive) {
          throw new Error('Your account has been suspended. Contact support.');
        }

        return {
          id: userId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          image: userData.avatar,
          phone: userData.phone,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const cookieStore = cookies();
        const intendedRole = cookieStore.get('intended_role')?.value;
        const isPartnerLogin = intendedRole === 'partner';
        
        const usersRef = db.collection('users');
        const byGoogleId = await usersRef.where('googleId', '==', account.providerAccountId).limit(1).get();
        let existingUserDoc = byGoogleId.empty ? null : byGoogleId.docs[0];

        if (!existingUserDoc && user.email) {
          const byEmail = await usersRef.where('email', '==', user.email).limit(1).get();
          if (!byEmail.empty) existingUserDoc = byEmail.docs[0];
        }

        if (!existingUserDoc) {
          const newUserData = {
            name: user.name,
            email: user.email,
            googleId: account.providerAccountId,
            avatar: user.image,
            role: isPartnerLogin ? 'partner' : 'customer',
            partnerStatus: isPartnerLogin ? 'pending' : 'none',
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
          (user as any).phone = newUserData.phone;
        } else {
          const existingData = existingUserDoc.data();
          const updates: any = {};
          
          if (!existingData.googleId) updates.googleId = account.providerAccountId;
          
          if (isPartnerLogin && existingData.role === 'customer') {
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
          (user as any).phone = existingData.phone;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.partnerStatus = (user as any).partnerStatus;
        token.id = user.id;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).partnerStatus = token.partnerStatus;
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
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
