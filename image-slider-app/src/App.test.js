import { render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios', () => ({
  get: jest.fn(),
}));

test('renders the immersive gallery controls', () => {
  axios.get.mockReturnValue(new Promise(() => {}));
  render(<App />);
  expect(screen.getByText(/quintessential gallery/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /miku/i })).toBeInTheDocument();
});
