import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EffectTile } from '../EffectTile';

const effect = {
  slug: 'arrow-rain', title: 'Arrow Rain', status: 'published' as const, tier: 'featured' as const,
  video: 'arrow-rain.mp4', poster: 'arrow-rain-poster.jpg', width: 1280, height: 638, order: 1,
};

test('renders as a button showing the poster, not the video', () => {
  render(<EffectTile effect={effect} onOpen={() => {}} />);
  const img = screen.getByRole('img', { name: /arrow rain/i });
  expect(img).toHaveAttribute('src', expect.stringContaining('arrow-rain-poster.jpg'));
  expect(document.querySelector('video')).toBeNull();
});

test('calls onOpen when activated by keyboard', async () => {
  const onOpen = vi.fn();
  render(<EffectTile effect={effect} onOpen={onOpen} />);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  expect(onOpen).toHaveBeenCalledWith(effect);
});

test('sets intrinsic width/height from the schema so the browser reserves space', () => {
  render(<EffectTile effect={effect} onOpen={() => {}} />);
  const img = screen.getByRole('img', { name: /arrow rain/i });
  expect(img).toHaveAttribute('width', '1280');
  expect(img).toHaveAttribute('height', '638');
});

test('reserves the same uniform container aspect ratio regardless of intrinsic dimensions', () => {
  // ink-swing is 1280x584 (recorded without Studio side panels) while the
  // rest are 1280x638. The grid tile must still present a uniform box so the
  // grid doesn't look ragged — the poster crops via object-cover.
  const inkSwing = {
    slug: 'ink-swing', title: 'Ink Swing', status: 'published' as const, tier: 'featured' as const,
    video: 'ink-swing.mp4', poster: 'ink-swing-poster.jpg', width: 1280, height: 584, order: 2,
  };
  const { unmount } = render(<EffectTile effect={effect} onOpen={() => {}} />);
  const wideImg = screen.getByRole('img', { name: /arrow rain/i });
  const wideContainer = wideImg.closest('button')!;
  unmount();

  render(<EffectTile effect={inkSwing} onOpen={() => {}} />);
  const inkImg = screen.getByRole('img', { name: /ink swing/i });
  const inkContainer = inkImg.closest('button')!;

  expect(inkContainer.className).toBe(wideContainer.className);
  expect(inkImg.className).toContain('object-cover');
});
