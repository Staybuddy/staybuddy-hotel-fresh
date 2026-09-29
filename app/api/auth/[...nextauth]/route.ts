import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';

async function handleReferral(newUser: any) {
  try {
    const cookieStore = cookies();
    const refCode = cookieStore.get('staybuddy_ref')?.value;
    if (refCode && !newUser.referredBy) {
      const referrer = await User.findOne({ referralCode: refCode });
      if (referrer && referrer.referralCount < 5 && referrer._id.toString() !== newUser._id.toString()) {
        newUser.referredBy = referrer._id;
        await newUser.save();
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
        role: { label: 'Role', type: 'text' }, // Allows passing role during initial registration
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error('Please enter your phone number and OTP');
        }

        // MOCK OTP VERIFICATION (Always accepts '123456')
        if (credentials.otp !== '123456') {
          throw new Error('Invalid OTP Code. (Hint: Use 123456 for testing)');
        }

        await connectDB();
        
        let user = await User.findOne({ phone: credentials.phone });
        
        // Auto-register if user doesn't exist
        if (!user) {
          user = await User.create({
            name: `User ${credentials.phone.slice(-4)}`,
            phone: credentials.phone,
            role: credentials.role || 'customer',
            isActive: true,
          });
          await handleReferral(user);
        }

        if (!user.isActive) {
          throw new Error('Your account has been suspended. Contact support.');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        await connectDB();
        
        const cookieStore = cookies();
        const intendedRole = cookieStore.get('intended_role')?.value;
        const isPartnerLogin = intendedRole === 'partner';
        
        let existingUser = await User.findOne({ 
          $or: [{ googleId: account.providerAccountId }, { email: user.email }] 
        });

        if (!existingUser) {
          // Auto-register new Google user
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            googleId: account.providerAccountId,
            avatar: user.image,
            role: isPartnerLogin ? 'partner' : 'customer',
            partnerStatus: isPartnerLogin ? 'pending' : 'none',
            isActive: true,
          });
          await handleReferral(newUser);
          user.id = newUser._id.toString();
          (user as any).role = newUser.role;
          (user as any).partnerStatus = newUser.partnerStatus;
          (user as any).phone = newUser.phone;
        } else {
          // Link google ID if email matched but googleId didn't
          if (!existingUser.googleId) {
            existingUser.googleId = account.providerAccountId;
          }
          
          // Upgrade customer to pending partner if they try to login as partner
          if (isPartnerLogin && existingUser.role === 'customer') {
            existingUser.role = 'partner';
            existingUser.partnerStatus = 'pending';
          }
          
          await existingUser.save();
          
          if (!existingUser.isActive) return false;
          user.id = existingUser._id.toString();
          (user as any).role = existingUser.role;
          (user as any).partnerStatus = existingUser.partnerStatus;
          (user as any).phone = existingUser.phone;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
