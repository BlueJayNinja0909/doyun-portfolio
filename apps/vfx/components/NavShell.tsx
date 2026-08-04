'use client';

import { usePathname } from 'next/navigation';
import { GradientMenu } from '@/components/GradientMenu';

/**
 * Positions the nav: floating over the home page, in normal flow everywhere else.
 *
 * The home page opens on a full-bleed clip, and a nav occupying its own band above
 * that clip is what made the first screen read as two stacked layers with a seam
 * between them. Lifting it out of flow fixes that, but only there.
 *
 * Applying the same overlay to every route does not work, and quietly. The pills
 * wrap: one row at desktop widths, two at 390px, three at 320px, which takes the
 * nav from 92px tall to 193px. The other routes clear it with a fixed pt-24, so at
 * 390px it covered their heading by 42px and at 320px by 97px. Clearing the worst
 * case everywhere would mean roughly 200px of empty space at the top of a phone
 * screen on pages that never wanted the overlay to begin with.
 *
 * Keyed off the route rather than a prop because the nav is rendered once in the
 * root layout, above the page that would pass one.
 */
export function NavShell() {
  const pathname = usePathname();
  // Trailing slash included: this app is a static export, so routes are emitted as
  // directories and the browser's path for the home page can be either form.
  const overHero = pathname === '/' || pathname === '';

  return (
    <div className={overHero ? 'absolute inset-x-0 top-0 z-50' : 'relative z-50'}>
      <GradientMenu />
    </div>
  );
}
