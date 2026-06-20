import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate } from 'react-router';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import AppLayout from './AppLayout';

/**
 * Route guard for the whole console. While a stored session is being restored it shows a
 * spinner; an unauthenticated visitor is bounced to /login; a logged-in but non-staff user
 * (role USER) is shown a no-access screen. Otherwise it renders the app shell (with Outlet).
 */
export default function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { status, user } = useAppSelector((s) => s.auth);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'USER') {
    return (
      <Box sx={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h6">This console is for staff only</Typography>
          <Typography color="text.secondary">
            Your account ({user.email}) does not have operator access.
          </Typography>
          <Button variant="outlined" onClick={() => dispatch(logout())}>
            Sign out
          </Button>
        </Stack>
      </Box>
    );
  }

  return <AppLayout />;
}
