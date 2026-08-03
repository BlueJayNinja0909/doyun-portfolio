import { describe, expect, test } from 'vitest';
import { createNode, stepNode, nodeCount, MAX_NODES, MIN_NODES } from '../constellation';

describe('createNode', () => {
  test('every node rises — vy is always negative', () => {
    for (let i = 0; i < 500; i++) {
      expect(createNode(1280, 800).vy).toBeLessThan(0);
    }
  });

  test('rises at both extremes of the random range', () => {
    // rand() === 0 and rand() === 1 are the slowest and fastest nodes; a sign error
    // that only shows at one end would slip past random sampling.
    expect(createNode(1280, 800, () => 0).vy).toBeLessThan(0);
    expect(createNode(1280, 800, () => 1).vy).toBeLessThan(0);
  });

  test('nearer nodes rise faster than distant ones', () => {
    const near = createNode(1280, 800, () => 1);
    const far = createNode(1280, 800, () => 0);
    expect(Math.abs(near.vy)).toBeGreaterThan(Math.abs(far.vy));
  });

  test('horizontal drift stays much smaller than vertical', () => {
    for (let i = 0; i < 200; i++) {
      const n = createNode(1280, 800);
      expect(Math.abs(n.vx)).toBeLessThan(Math.abs(n.vy));
    }
  });

  test('depth stays inside the documented range', () => {
    expect(createNode(1, 1, () => 0).depth).toBeCloseTo(0.35, 5);
    expect(createNode(1, 1, () => 1).depth).toBeCloseTo(1, 5);
  });
});

describe('stepNode', () => {
  test('a node leaving the top re-enters at the bottom', () => {
    const n = { x: 100, y: -59, vx: 0, vy: -5, depth: 0.5 };
    stepNode(n, 1280, 800, () => 0.5);
    expect(n.y).toBeGreaterThan(800);
  });

  test('re-entry picks a fresh horizontal position', () => {
    const n = { x: 100, y: -100, vx: 0, vy: -1, depth: 0.5 };
    stepNode(n, 1280, 800, () => 0.25);
    expect(n.x).toBe(320);
  });

  test('density is conserved — a node never simply disappears', () => {
    const n = createNode(1280, 800);
    for (let i = 0; i < 20_000; i++) stepNode(n, 1280, 800);
    expect(Number.isFinite(n.x) && Number.isFinite(n.y)).toBe(true);
    expect(n.y).toBeGreaterThan(-61);
    expect(n.y).toBeLessThan(861);
  });

  test('horizontal wrap works in both directions', () => {
    const left = { x: -61, y: 400, vx: 0, vy: -1, depth: 0.5 };
    stepNode(left, 1280, 800);
    expect(left.x).toBe(1340);

    const right = { x: 1341, y: 400, vx: 0, vy: -1, depth: 0.5 };
    stepNode(right, 1280, 800);
    expect(right.x).toBe(-60);
  });
});

describe('nodeCount', () => {
  test('scales with viewport area', () => {
    expect(nodeCount(1920, 1080)).toBeGreaterThan(nodeCount(390, 700));
  });

  test('stays within the documented bounds on extreme viewports', () => {
    expect(nodeCount(200, 200)).toBe(MIN_NODES);
    expect(nodeCount(6000, 4000)).toBe(MAX_NODES);
  });
});
