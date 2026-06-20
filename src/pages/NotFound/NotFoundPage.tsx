import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          404
        </Typography>
        <Typography color="text.secondary">
          That page doesn&apos;t exist.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Back to dashboard
        </Button>
      </Stack>
    </Box>
  );
}
