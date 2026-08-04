import type { Metadata } from 'next';
import { Constellation } from '@/components/Constellation';
import { CursorGlow } from '@/components/CursorGlow';
import { GradientMenu } from '@/components/GradientMenu';
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
        {/* The pill's resting colour is white/75 on the #050507 ground. White at /40
            gives a contrast ratio of 3.6 and /45 gives 4.42, both under the 4.5 WCAG AA
            minimum for text this size; /75 clears it with margin while still reading as
            secondary against the headline, and it goes to full white on hover. */}
        <GradientMenu />
        {children}
      </body>
    </html>
  );
}
