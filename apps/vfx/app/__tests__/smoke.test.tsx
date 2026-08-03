import { render, screen } from '@testing-library/react';
import Page from '../page';

test('reel page renders the site name', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/doyun/i);
});
