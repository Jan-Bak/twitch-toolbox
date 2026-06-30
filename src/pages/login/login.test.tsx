import { render, screen } from '@testing-library/react';
import Login from './login';
import { describe, expect, it } from 'vitest';

describe('Login component', () => {
  it('Renders title', () => {
    render(<Login />);

    const title = screen.getByText(/Hello/i);

    expect(title).toBeInTheDocument();
  });

  it('Renders login button', () => {
    render(<Login />);

    const loginButton = screen.getByRole('button', { name: /Login via Twitch/i });

    expect(loginButton).toBeInTheDocument();
  });
});
