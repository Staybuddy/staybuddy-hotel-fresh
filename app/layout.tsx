import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};
import './globals.css';
import Providers from '@/components/Providers';
import SplashScreen from '@/components/SplashScreen';
import ReferralTracker from '@/components/ReferralTracker';
import { Suspense } from 'react';
import Script from 'next/script';

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
      <head>
        {/* Preload trending city destination images for instantaneous 0ms display on mobile & desktop */}
        <link rel="preload" as="image" href="/images/destinations/mumbai.jpg" />
        <link rel="preload" as="image" href="/images/destinations/goa.jpg" />
        <link rel="preload" as="image" href="/images/destinations/delhi.jpg" />
        <link rel="preload" as="image" href="/images/destinations/manali.jpg" />
        <link rel="preload" as="image" href="/images/destinations/kerala.jpg" />
      </head>
      <body>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
