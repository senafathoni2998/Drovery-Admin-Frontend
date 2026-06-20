import { ThemeProvider } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';

import type { RootState } from '../app/store';
import authReducer from '../features/auth/authSlice';
import type { CurrentUser } from '../models/auth';
import { theme } from '../theme/theme';

interface RenderOptions {
  /** Preloaded Redux state (e.g. an authenticated admin). */
  preloadedState?: Partial<RootState>;
  /** MemoryRouter initial entries (use to drive useParams via routePath). */
  initialEntries?: string[];
  /** When set, the ui is mounted at this Route path so useParams resolves. */
  routePath?: string;
}

/** Render a component inside the real store + router + MUI theme used by the app. */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions = {},
) {
  const { preloadedState, initialEntries = ['/'], routePath } = options;
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloadedState as RootState | undefined,
  });
  const tree = routePath ? (
    <Routes>
      <Route path={routePath} element={ui} />
    </Routes>
  ) : (
    ui
  );
  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={initialEntries}>{tree}</MemoryRouter>
        </ThemeProvider>
      </Provider>,
    ),
  };
}

/** A signed-in admin auth slice for `preloadedState`. */
export function authedAdmin(over: Partial<CurrentUser> = {}): Partial<RootState> {
  const user: CurrentUser = {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@drovery.com',
    role: 'ADMIN',
    locale: 'en',
    ...over,
  };
  return { auth: { user, status: 'authenticated', error: null } };
}
