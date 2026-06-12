import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, IBM_Plex_Mono } from 'next/font/google';

import { Providers } from './providers';
import '../styles/globals.css';

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MaintFlow — GMAO',
  description: 'Gestion de maintenance assistée par ordinateur',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-surface font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
