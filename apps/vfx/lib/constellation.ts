/**
 * Node model for the constellation background.
 *
 * Extracted from the component so the motion invariants can be unit-tested. Asserting
 * them from the rendered canvas does not work: once nodes wrap from top to bottom the
 * field reaches equilibrium and its pixel centroid becomes statistically stationary, so
 * a test that samples the canvas measures a startup transient and then stops being
 * true. The direction of travel lives here, where it can be checked directly.
 */

export type ConstellationNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0.35–1. Drives parallax strength, apparent size, and rise speed. */
  depth: number;
};

export const AREA_PER_NODE = 13_000;
export const MAX_NODES = 140;
export const MIN_NODES = 34;

/** How many nodes a viewport of this size should hold. */
export function nodeCount(width: number, height: number): number {
  return Math.max(MIN_NODES, Math.min(MAX_NODES, Math.round((width * height) / AREA_PER_NODE)));
}

/**
 * `rand` is injectable so tests can drive the extremes of the range rather than
 * sampling randomly and hoping.
 */
export function createNode(width: number, height: number, rand: () => number = Math.random): ConstellationNode {
  const depth = 0.35 + rand() * 0.65;
  return {
    x: rand() * width,
    y: rand() * height,
    // Small horizontal wander only — enough that the drift doesn't look like a rigid
    // conveyor, not enough to read as sideways motion.
    vx: (rand() - 0.5) * 0.09,
    // Always negative: the whole field rises. Nearer nodes rise faster, which is what
    // makes the depth legible.
    vy: -(0.08 + rand() * 0.16) * (0.5 + depth),
    depth,
  };
}

/**
 * Advances a node one frame, wrapping it back into view. Nodes leaving the top re-enter
 * at the bottom on a fresh horizontal position — reusing the old x makes the same
 * vertical lanes visibly repeat every cycle.
 */
export function stepNode(
  n: ConstellationNode,
  width: number,
  height: number,
  rand: () => number = Math.random,
): void {
  n.x += n.vx;
  n.y += n.vy;
  if (n.y < -60) {
    n.y = height + 60;
    n.x = rand() * width;
  }
  if (n.x < -60) n.x = width + 60;
  if (n.x > width + 60) n.x = -60;
}
