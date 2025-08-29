// App.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from './App';

test('renders the App component and increments count on button click', () => {
  render(<App />);

  // Check initial button text
  const button = screen.getByRole('button', { name: /count is 0/i });
  expect(button).toBeInTheDocument();

  // Click the button
  fireEvent.click(button);

  // Check updated button text
  expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument();
});

test('renders Vite and React logos with correct alt text', () => {
  render(<App />);

  const viteLogo = screen.getByAltText('Vite logo');
  const reactLogo = screen.getByAltText('React logo');

  expect(viteLogo).toBeInTheDocument();
  expect(reactLogo).toBeInTheDocument();
});
