import { render, screen } from '@testing-library/react';
import { Flipbook } from '../Flipbook';

const texture = {
  slug: 'dissipate-01', title: 'Dissipation', status: 'published' as const,
  source: 'flipbook-11.webp', grid: { cols: 4, rows: 6, frames: 21 }, fps: 24,
};

test('exposes the sheet as an image with an accessible name', () => {
  render(<Flipbook texture={texture} src="/textures/flipbook-11.webp" />);
  expect(screen.getByRole('img', { name: /dissipation/i })).toBeInTheDocument();
});

test('sets background-size from the grid', () => {
  render(<Flipbook texture={texture} src="/textures/flipbook-11.webp" />);
  const el = screen.getByTestId('flipbook-frame');
  expect(el).toHaveStyle({ backgroundSize: '400% 600%' });
});

test('is keyboard focusable so hover-only playback is not the sole affordance', () => {
  render(<Flipbook texture={texture} src="/textures/flipbook-11.webp" />);
  expect(screen.getByRole('img', { name: /dissipation/i })).toHaveAttribute('tabindex', '0');
});
