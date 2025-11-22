import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Market Board - Rochester Jewelry & Coin',
  description: 'Internal market dashboard for Rochester Jewelry & Coin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={inter.className}>
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-6 py-2">
            <p className="text-xs text-gray-600 tracking-widest uppercase font-mono">
              Rochester Jewelry & Coin · Internal
            </p>
          </div>
        </div>
        <div className="pt-10">{children}</div>
      </body>
    </html>
  );
}
