import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from './providers';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'MaintFlow — GMAO',
  description: 'Gestion de maintenance assistée par ordinateur',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
