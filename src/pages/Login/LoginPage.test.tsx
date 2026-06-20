import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders, authedAdmin } from '../../test/renderWithProviders';
import LoginPage from './LoginPage';

// The api client is the single chokepoint (authSlice.login -> apiFetch).
vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

import { apiFetch } from '../../api/client';
const mockFetch = vi.mocked(apiFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('LoginPage', () => {
  it('renders the email + password fields and a Sign in button', () => {
    renderWithProviders(<LoginPage />);

    // role 'textbox' for the email TextField (type=email); password TextField has no
    // accessible textbox role, so query it by its label.
    expect(screen.getByRole('textbox', { name: /Email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('disables the Sign in button while the fields are empty', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('button', { name: /Sign in/i })).toBeDisabled();
  });

  it('renders the auth error text when auth.error is set', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: { user: null, status: 'unauthenticated', error: 'Bad credentials' },
      },
    });

    expect(screen.getByText('Bad credentials')).toBeInTheDocument();
    // Surfaced as a MUI Alert.
    expect(screen.getByRole('alert')).toHaveTextContent('Bad credentials');
  });

  it('redirects (does not render the form) when already authenticated', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: authedAdmin(),
      initialEntries: ['/login'],
    });

    // status === 'authenticated' short-circuits to <Navigate to="/" />, so the form
    // (and its Sign in button) is never rendered.
    expect(screen.queryByRole('button', { name: /Sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Email/i })).not.toBeInTheDocument();
  });
});
