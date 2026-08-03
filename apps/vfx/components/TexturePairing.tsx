import type { Effect, Texture } from '@/lib/schema';

/**
 * Shows the texture sheet an effect was built from, beside the effect.
 *
 * Intentionally minimal: no effect currently sets `pairsWith` because no
 * confirmed mapping from Doyun exists yet between the nine texture studies
 * and the five showcased clips (see schema.ts `pairsWith` and the Task 9
 * design-doc note on this gap). Until that mapping is supplied, this
 * component renders nothing rather than guess a pairing — an incorrect
 * guess here would violate the rule that the texture studies must never be
 * implied to be the textures used in the showcased effects.
 */
export function TexturePairing({ effect, textures }: { effect: Effect; textures: Texture[] }) {
  if (!effect.pairsWith) return null;
  const texture = textures.find((t) => t.slug === effect.pairsWith);
  if (!texture) return null;

  return (
    <p className="mt-2 text-xs text-white/40">
      Built from the{' '}
      <a href="/textures/" className="underline hover:text-white/70">
        {texture.title}
      </a>{' '}
      texture study.
    </p>
  );
}
