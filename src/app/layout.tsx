import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import Script from 'next/script';
import { getSquareWebSDKUrl } from '@/lib/env-validation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Empire Football Group',
  description: 'Main Website made for Empire Football Group',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const squareSDKUrl = getSquareWebSDKUrl();

  return (
    <html lang="en">
      <head>
        {/* Square Web Payments SDK - dynamically determined by environment */}
        <Script
          src={squareSDKUrl}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}