import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doyun — Roblox VFX',
  description: 'Stylized Roblox visual effects: particles, trails, and impact work.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#050507]">
      <body className="antialiased">
        <div className="ambient" aria-hidden="true" />
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs uppercase tracking-[0.16em] text-white/45">
          <a href="/" className="hover:text-white">Doyun.vfx</a>
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
