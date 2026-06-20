import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';

import type { RootState } from '../app/store';
import { authedAdmin, renderWithProviders } from '../test/renderWithProviders';
import ProtectedRoute from './ProtectedRoute';

function renderGuard(preloadedState?: Partial<RootState>) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>LOGIN SCREEN</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>PROTECTED CONTENT</div>} />
      </Route>
    </Routes>,
    { preloadedState, initialEntries: ['/'] },
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when unauthenticated', () => {
    renderGuard({ auth: { user: null, status: 'unauthenticated', error: null } });
    expect(screen.getByText('LOGIN SCREEN')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED CONTENT')).not.toBeInTheDocument();
  });

  it('shows a spinner while the session is loading', () => {
    renderGuard({ auth: { user: null, status: 'loading', error: null } });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the app shell + page for an authenticated admin', () => {
    renderGuard(authedAdmin());
    expect(screen.getByText('PROTECTED CONTENT')).toBeInTheDocument();
  });

  it('blocks a non-staff (USER) account', () => {
    renderGuard(authedAdmin({ role: 'USER' }));
    expect(screen.getByText(/staff only/i)).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED CONTENT')).not.toBeInTheDocument();
  });
});
