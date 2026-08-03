// Proves @doyun/motion resolves as a workspace dependency by package name
// (via npm workspaces symlink), not merely by relative import from within
// packages/motion itself. Task 8 will `import { SPRING_SNAPPY } from
// '@doyun/motion'` inside this app — if that resolution is broken, this
// test fails first.
import { Reveal, SPRING_SNAPPY, SPRING_SOFT } from '@doyun/motion';

test('@doyun/motion resolves by package name and exports the expected interface', () => {
  expect(typeof Reveal).toBe('function');
  expect(SPRING_SNAPPY).toEqual({ type: 'spring', stiffness: 420, damping: 34 });
  expect(SPRING_SOFT).toEqual({ type: 'spring', stiffness: 180, damping: 26 });
});
