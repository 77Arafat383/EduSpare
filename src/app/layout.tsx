import type { Metadata } from 'next';
import './globals.css';
import { EduSpareProvider } from '@/context/EduSpareContext';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/assets/eduspare_brain_icon_without_bg.png" />
        <link rel="shortcut icon" href="/assets/eduspare_brain_icon_without_bg.png" />
        <link rel="apple-touch-icon" href="/assets/eduspare_brain_icon_without_bg.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background text-on-surface">
        <EduSpareProvider>{children}</EduSpareProvider>
      </body>
    </html>
  );
}
