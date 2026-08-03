import { describe, expect, test } from 'vitest';
import {
  spriteFrameCount,
  spriteBackgroundSize,
  spriteStepsX,
  spriteStepsY,
} from '../sprite';

describe('spriteFrameCount', () => {
  test('defaults to cols * rows', () => {
    expect(spriteFrameCount({ cols: 4, rows: 6 })).toBe(24);
  });

  test('honours an explicit frame count for partially filled sheets', () => {
    expect(spriteFrameCount({ cols: 4, rows: 6, frames: 21 })).toBe(21);
  });

  test('never exceeds the grid capacity', () => {
    expect(() => spriteFrameCount({ cols: 4, rows: 4, frames: 20 })).toThrow(
      /exceeds grid capacity/,
    );
  });
});

describe('spriteBackgroundSize', () => {
  test('scales by grid dimensions', () => {
    expect(spriteBackgroundSize({ cols: 6, rows: 6 })).toBe('600% 600%');
  });

  test('handles non-square grids', () => {
    expect(spriteBackgroundSize({ cols: 4, rows: 6 })).toBe('400% 600%');
  });
});

describe('step counts', () => {
  test('x steps equal columns, y steps equal rows', () => {
    expect(spriteStepsX({ cols: 4, rows: 6 })).toBe(4);
    expect(spriteStepsY({ cols: 4, rows: 6 })).toBe(6);
  });
});

describe('validation', () => {
  test('rejects non-positive dimensions', () => {
    expect(() => spriteBackgroundSize({ cols: 0, rows: 4 })).toThrow(/positive/);
  });
});
