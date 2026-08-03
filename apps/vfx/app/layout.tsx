import type { Metadata } from 'next';
import { Constellation } from '@/components/Constellation';
import { CursorGlow } from '@/components/CursorGlow';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doyun Lee — Roblox VFX',
  description: 'Stylized Roblox visual effects: particles, trails, and impact work.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#050507]">
      <body className="antialiased">
        <div className="ambient" aria-hidden="true" />
        <Constellation />
        <CursorGlow />
        {/* On the #050507 ground, white at /40 gives a contrast ratio of 3.6 and /45
            gives 4.42 — both under the 4.5 WCAG AA minimum for text this size. /50 is
            the first passing step (5.2); /65 here clears it with margin while still
            reading as secondary against the headline. */}
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs uppercase tracking-[0.16em] text-white/65">
          <a href="/" className="hover:text-white">Doyun Lee VFX</a>
          <span className="flex gap-6">
            <a href="/textures/" className="hover:text-white">Textures</a>
            <a href="/commissions/" className="hover:text-white">Commissions</a>
          </span>
        </nav>
        {children}
      </body>
    </html>
  );
}
