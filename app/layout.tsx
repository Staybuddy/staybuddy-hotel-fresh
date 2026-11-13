import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ea580c',
};
import './globals.css';
import Providers from '@/components/Providers';
import SplashScreen from '@/components/SplashScreen';
import ReferralTracker from '@/components/ReferralTracker';
import { Suspense } from 'react';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.staybuddy.in'),
  title: 'StayBuddy — Find & Book Hotels',
  description: 'StayBuddy is your trusted OTA platform for hotel bookings. Find the best hotels at the best prices — from budget stays to luxury escapes.',
  keywords: 'hotel booking, OTA, travel, accommodation, StayBuddy',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'StayBuddy — Find & Book Hotels',
    description: 'Find the best hotels at the best prices.',
    type: 'website',
    images: [{ url: '/staybuddy-logo-pin.png', width: 134, height: 122, alt: 'StayBuddy Logo' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
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
