import { Box, CircularProgress } from '@mui/material';

/** Suspense fallback for lazily-loaded route pages. */
export default function PageLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 8, minHeight: 240 }}>
      <CircularProgress />
    </Box>
  );
}
