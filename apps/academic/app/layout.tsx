import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doyun Lee — Research and projects',
  description:
    'Independent research and technical projects: transit economics in Rancho Bernardo, ' +
    'carbon-to-fuel pathways, and a calculus game built in Roblox.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#FBFAF7] text-[#14140F] antialiased">
        <nav className="mx-auto flex max-w-3xl items-baseline justify-between gap-x-6 px-6 py-6 text-[11px] uppercase tracking-[0.16em] text-stone-600">
          <a href="/" className="hover:text-stone-900">
            Doyun Lee
          </a>
          <span className="flex flex-wrap items-baseline justify-end gap-x-5 gap-y-1">
            <a href="/work/transit-vs-driving/" className="hover:text-stone-900">
              Transit study
            </a>
            {/* The other half of the portfolio. The two sites had no link between them
                in either direction, so anyone arriving at one had no way of knowing
                the other existed. */}
            <a
              href="https://doyun-vfx-alpha.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-900"
            >
              VFX work
            </a>
          </span>
        </nav>

        {children}

        <footer className="mx-auto max-w-3xl border-t border-stone-200 px-6 py-10 text-xs leading-relaxed text-stone-600">
          Doyun Lee &middot;{' '}
          <a href="mailto:doyunlee1025@gmail.com" className="underline hover:text-stone-900">
            doyunlee1025@gmail.com
          </a>
        </footer>
      </body>
    </html>
  );
}
