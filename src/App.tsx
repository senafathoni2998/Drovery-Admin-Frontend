import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router';

import { setUnauthorizedHandler } from './api/client';
import { getToken } from './api/tokenStorage';
import { useAppDispatch } from './app/hooks';
import { loadCurrentUser, logout } from './features/auth/authSlice';
import { router } from './router/router';
import { theme } from './theme/theme';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // A 401 anywhere drives a global logout (→ ProtectedRoute bounces to /login).
    setUnauthorizedHandler(() => {
      dispatch(logout());
    });
    // Restore an existing session on load.
    if (getToken()) dispatch(loadCurrentUser());
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
