/**
 * Liquid-glass surface: a refracting backdrop plus the rim-light shadow stack.
 *
 * Adapted from the circulating "liquid glass button" snippet rather than copied.
 * What is kept is the part that produces the look: an SVG displacement filter used
 * as a `backdrop-filter`, so whatever sits behind the element is bent rather than
 * merely blurred, under a stack of inset shadows that reads as a glass rim.
 *
 * What is not kept, and why:
 *
 *  - The snippet is three components (Button, LiquidButton, MetalButton) behind a
 *    class-variance-authority variant system. Two of the three and every variant
 *    are unused here.
 *  - Those pieces need @radix-ui/react-slot, class-variance-authority, and a `cn`
 *    helper which itself needs clsx and tailwind-merge. Four packages, none of
 *    them currently in this app, to style one element.
 *  - LiquidButton renders a <button>. The control it is replacing is an <a> that
 *    drives an eased 1500ms scroll and must stay a real link, so a drop-in
 *    replacement would have cost the smooth scroll, middle-click and open-in-new-tab.
 *
 * Rendering the layers separately means they can go inside the existing anchor and
 * none of that is lost. The visual is the snippet's; the plumbing is not.
 */
export function LiquidGlassLayers() {
  return (
    <>
      {/* The rim. Inset shadows on all four sides give the thick-glass edge, and
          the single outer glow lifts it off the background. */}
      <span className="liquid-glass-rim" aria-hidden="true" />
      {/*
        The refraction, the layer that bends the hero clip playing behind it.

        Applied inline rather than from the stylesheet, and not by preference. In
        globals.css this declaration does not survive the build: Lightning CSS,
        which Next runs over the output, decides `backdrop-filter: url(...)` is
        unsupported for the target browsers and rewrites the rule down to the
        `-webkit-` prefixed form alone. Chromium then rejects that combination and
        the computed value comes back `none`, so the effect silently disappears in
        production while looking correct in the source. Verified by reading the
        built CSS and then confirming on the page that toggling the property
        changed nothing, because there was nothing to toggle.

        Inline styles are not processed by that minifier, so the value arrives
        intact. It also layers correctly: where a browser cannot parse the url()
        form it drops this declaration and falls back to the frosted blur in the
        stylesheet, with no @supports query needed.
      */}
      <span
        className="liquid-glass-refract"
        aria-hidden="true"
        style={{ backdropFilter: 'url("#liquid-glass-displace")' }}
      />
      <GlassFilter />
    </>
  );
}

/**
 * The displacement filter itself.
 *
 * `scale` is 14, well down from the snippet's 70. That value is written for a
 * large panel; at 70 the displacement is ±35px, which on a button roughly 44px
 * tall drags the backdrop further than the button's own height and smears it into
 * mush. 14 bends the clip behind it visibly without losing what it is a picture of.
 *
 * Hidden rather than removed from flow: an SVG carrying only <defs> paints nothing,
 * but it has to stay in the document for the filter reference to resolve.
 */
function GlassFilter() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
      <defs>
        <filter
          id="liquid-glass-displace"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="1.2" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}
