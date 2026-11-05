'use client';
import { SessionProvider } from 'next-auth/react';
import PostCheckoutReviewModal from '@/components/PostCheckoutReviewModal';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PostCheckoutReviewModal />
    </SessionProvider>
  );
}
