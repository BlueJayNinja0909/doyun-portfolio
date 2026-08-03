export type SpriteGrid = {
  /** Number of frame columns in the sheet. */
  cols: number;
  /** Number of frame rows in the sheet. */
  rows: number;
  /** Actual frames, when the final row is partially filled. Defaults to cols * rows. */
  frames?: number;
};

function assertGrid({ cols, rows }: SpriteGrid): void {
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) {
    throw new Error(`Sprite grid must have positive integer dimensions, got ${cols}x${rows}`);
  }
}

export function spriteFrameCount(grid: SpriteGrid): number {
  assertGrid(grid);
  const capacity = grid.cols * grid.rows;
  if (grid.frames === undefined) return capacity;
  if (grid.frames > capacity) {
    throw new Error(
      `frames (${grid.frames}) exceeds grid capacity (${capacity}) for ${grid.cols}x${grid.rows}`,
    );
  }
  return grid.frames;
}

export function spriteBackgroundSize(grid: SpriteGrid): string {
  assertGrid(grid);
  return `${grid.cols * 100}% ${grid.rows * 100}%`;
}

export function spriteStepsX(grid: SpriteGrid): number {
  assertGrid(grid);
  return grid.cols;
}

export function spriteStepsY(grid: SpriteGrid): number {
  assertGrid(grid);
  return grid.rows;
}
