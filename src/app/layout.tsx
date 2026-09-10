import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EduSpareProvider } from '@/context/EduSpareContext';

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
  icons: {
    icon: '/assets/eduspare_brain_icon_without_bg.png',
    shortcut: '/assets/eduspare_brain_icon.png',
    apple: '/assets/eduspare_brain_icon.svg',
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
        <link rel="icon" type="image/png" href="/assets/eduspare_brain_icon_without_bg.png" />
        <link rel="shortcut icon" href="/assets/eduspare_brain_icon_without_bg.png" />
        <link rel="apple-touch-icon" href="/assets/eduspare_brain_icon_without_bg.png" />
      </head>
      <body className={`${inter.className} font-sans antialiased bg-background text-on-surface`}>
        <EduSpareProvider>{children}</EduSpareProvider>
      </body>
    </html>
  );
}
