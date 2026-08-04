import type { ReactNode } from 'react';

/**
 * Outline icon buttons linking to Doyun's profiles.
 *
 * Adapted from the shadcn social-icon snippet rather than copied. The pattern kept
 * is the visual one: a row of bordered square buttons holding a single glyph, each
 * growing slightly on hover.
 *
 * What changed, and why each one mattered:
 *
 *  - These are anchors, not buttons. The snippet renders `<button type="button">`,
 *    which is a control that does nothing when pressed. Anything that navigates has
 *    to be a link, or screen readers announce the wrong role, keyboard users get the
 *    wrong affordance, and middle-click and open-in-new-tab do not work at all.
 *  - Icons are inline SVG rather than <img src="https://images.shadcnspace.com/...">.
 *    Hotlinking a third party for core UI means an extra DNS lookup and connection on
 *    a page that currently makes none, leaks every visitor's IP to that host, and
 *    breaks silently if they move the files. These are four paths; there is no reason
 *    to fetch them.
 *  - No shadcn Button. It needs @radix-ui/react-slot, class-variance-authority and a
 *    `cn` helper that needs clsx and tailwind-merge: four packages, for two links,
 *    none of them currently in this app.
 *  - The accessible name is the network, not "google icon". The snippet's name comes
 *    from the img alt, so its buttons announce as "google icon" rather than "Google".
 *
 * Drawn in Lucide's 24px stroke style so they sit with the nav icons, which are
 * Lucide. Lucide itself cannot supply these: it dropped brand marks over trademark
 * concerns, so Instagram and LinkedIn are not among its 6000-odd exports.
 */

type Social = { label: string; href: string; icon: ReactNode };

const SOCIALS: Social[] = [
  {
    label: 'Instagram',
    // Bare profile URL. The link as sent carried `igsh`, a share token tied to the
    // QR code that produced it, which is not something to publish.
    href: 'https://www.instagram.com/ddoyunlee_',
    icon: (
      <>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/doyun-lee-83b108390/',
    icon: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
];

export function SocialLinks() {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-3">
      {SOCIALS.map(({ label, href, icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            // noreferrer alongside noopener: the first is the security one, the second
            // stops the destination seeing which page the click came from.
            rel="noopener noreferrer"
            // scale-110 rather than the snippet's scale-120, which is not a class
            // Tailwind generates. A hover effect that silently does nothing is worse
            // than a smaller one that works.
            className="group flex h-10 w-10 items-center justify-center rounded-lg border border-white/15
                       bg-white/[0.04] text-white/70 transition-all duration-300
                       hover:scale-110 hover:border-white/35 hover:bg-white/[0.09] hover:text-white
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[18px] w-[18px]"
              aria-hidden="true"
            >
              {icon}
            </svg>
            {/* The label, available to assistive tech and to search, without
                occupying space. An icon-only control with no text has no name. */}
            <span className="sr-only">{label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
