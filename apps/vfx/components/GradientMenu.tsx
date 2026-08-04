import { User, Sparkles, LayoutGrid, Mail } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * The site nav: icon pills that expand into labelled buttons.
 *
 * Adapted from the circulating "gradient menu" snippet, with the parts that matter for a
 * navigation bar rather than a demo:
 *
 *  - Real anchors. The original renders bare `<li>` elements with the interaction on
 *    hover only, so nothing is focusable, nothing is announced as a link, and the whole
 *    nav is invisible to the keyboard. Replacing working links with that would be a
 *    straight regression, so each pill is an `<a>` and focus-visible mirrors hover
 *    exactly.
 *  - A non-hover fallback. The label only exists on hover in the original, which on a
 *    phone leaves four unlabelled coloured circles and no way to discover what they do.
 *    The collapse is gated behind `@media (hover: hover)` in globals.css, so touch
 *    devices get the pills permanently expanded with their labels visible.
 *  - Site colours. The demo's palette is unrelated candy gradients on white pills. These
 *    are the wordmark's own gradient stops on the site's dark ground, so the nav belongs
 *    to the same page as everything else.
 *
 * The hover mechanic itself is unchanged: the pill widens, the icon scales out, the
 * label scales in behind it, and a blurred copy of the gradient glows underneath.
 */

type Item = {
  title: string;
  href: string;
  icon: ReactNode;
  /** Both stops come from GradientShimmer's ramp, so the nav and the wordmark agree. */
  from: string;
  to: string;
};

const ITEMS: Item[] = [
  { title: 'Doyun Lee', href: '/#about', icon: <User />, from: '#8B7BFF', to: '#C77BFF' },
  { title: 'VFX', href: '/#work', icon: <Sparkles />, from: '#C77BFF', to: '#FF7BC3' },
  { title: 'Textures', href: '/textures/', icon: <LayoutGrid />, from: '#FF7BC3', to: '#FF9E7B' },
  { title: 'Commissions', href: '/commissions/', icon: <Mail />, from: '#7BE0FF', to: '#8B7BFF' },
];

export function GradientMenu() {
  return (
    <nav aria-label="Primary" className="mx-auto max-w-6xl px-6 py-5">
      <ul className="gmenu">
        {ITEMS.map(({ title, href, icon, from, to }) => (
          <li key={href}>
            <a
              href={href}
              className="gmenu-pill"
              // Custom properties need the cast: React's CSSProperties has no index
              // signature, so `--x` is not assignable without it.
              style={{ '--from': from, '--to': to } as React.CSSProperties}
            >
              {/* Gradient fill and its blurred glow. Both are aria-hidden decoration. */}
              <span className="gmenu-fill" aria-hidden="true" />
              <span className="gmenu-glow" aria-hidden="true" />

              <span className="gmenu-icon" aria-hidden="true">
                {icon}
              </span>
              {/* Not aria-hidden and never display:none, so the accessible name is the
                  label rather than the icon, at every viewport. */}
              <span className="gmenu-label">{title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
