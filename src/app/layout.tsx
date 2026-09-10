import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EduSpareProvider } from '@/context/EduSpareContext';
import { ServiceWorkerRegistrar } from '@/components/common/ServiceWorkerRegistrar';

// Self-hosted, subset, preloaded at build time: no request to Google Fonts at
// runtime, no render-blocking stylesheet and no layout shift (font-display: swap
// with size-adjusted fallback).
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'EduSpare',
  description:
    'EduSpare integrates activity heatmaps, intelligent task prioritization, Notion-style task workspaces with AI Tutors, Facebook-style blogs, real-time user chat, profile vaults, and study communities.',
  manifest: '/manifest.webmanifest',
  applicationName: 'EduSpare',
  appleWebApp: { capable: true, title: 'EduSpare', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/assets/icon-192.png',
    apple: '/assets/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FAF8FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preload" as="image" href="/assets/eduspare_brain_icon_128.png" />
      </head>
      <body className={`${inter.className} font-sans antialiased bg-background text-on-surface`}>
        <EduSpareProvider>{children}</EduSpareProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
