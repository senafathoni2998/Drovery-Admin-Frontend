import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router';

import { setUnauthorizedHandler } from './api/client';
import { getToken } from './api/tokenStorage';
import { useAppDispatch } from './app/hooks';
import { loadCurrentUser, sessionExpired } from './features/auth/authSlice';
import { router } from './router/router';
import { theme } from './theme/theme';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // A 401 whose refresh ALSO failed (api/client) means the session is truly dead — tear it
    // down locally (the token is already cleared) so ProtectedRoute bounces to /login. No
    // server round-trip here; the operator-initiated logout button revokes server-side.
    setUnauthorizedHandler(() => {
      dispatch(sessionExpired());
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
