import type { Metadata } from 'next';
import './globals.css';
import { EduSpareProvider } from '@/context/EduSpareContext';

export const metadata: Metadata = {
  title: 'EduSpare - All-in-One SaaS Educational Platform',
  description:
    'EduSpare integrates activity heatmaps, intelligent task prioritization, Notion-style task workspaces with AI Tutors, Facebook-style blogs, real-time user chat, profile vaults, and study communities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
