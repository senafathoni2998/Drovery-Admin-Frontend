import { Box, Stack, Typography } from '@mui/material';

// Placeholder for sections whose feature increment hasn't landed yet. Each is replaced by
// its real page (Deliveries, Promos, Users, Support) in a later commit.
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h4">{title}</Typography>
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography>This section is coming soon.</Typography>
      </Box>
    </Stack>
  );
}
