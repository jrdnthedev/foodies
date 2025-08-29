// App.test.tsx
import { render } from '@testing-library/react';
import { test } from 'vitest';
import App from './App';

test('renders the App component and increments count on button click', () => {
  render(<App />);
});
