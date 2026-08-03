import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doyun — Roblox VFX',
  description: 'Stylized Roblox visual effects: particles, trails, and impact work.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#050507]">
      <body className="antialiased">{children}</body>
    </html>
  );
}
