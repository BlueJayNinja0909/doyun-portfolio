import { render, screen } from '@testing-library/react';
import Commissions from '../commissions/page';

test('commissions page shows the contact email', () => {
  render(<Commissions />);
  expect(screen.getByText(/yippyfx@gmail\.com/)).toBeInTheDocument();
});

test('commissions page never exposes a phone number', () => {
  const { container } = render(<Commissions />);
  expect(container.textContent).not.toMatch(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
});
