import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import SplashScreen from '@/components/SplashScreen';
import ReferralTracker from '@/components/ReferralTracker';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'StayBuddy — Find & Book Hotels',
  description: 'StayBuddy is your trusted OTA platform for hotel bookings. Find the best hotels at the best prices — from budget stays to luxury escapes.',
  keywords: 'hotel booking, OTA, travel, accommodation, StayBuddy',
  openGraph: {
    title: 'StayBuddy — Find & Book Hotels',
    description: 'Find the best hotels at the best prices.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
