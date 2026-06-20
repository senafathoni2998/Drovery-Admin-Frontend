import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';

import { useApi } from '../../hooks/useApi';
import type { AdminOverview } from '../../models/admin';
import type { DeliveryStatus } from '../../models/enums';
import {
  DELIVERY_STATUSES,
  deliveryStatusColor,
  humanizeEnum,
} from '../../models/enums';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useApi<AdminOverview>('/admin/overview');

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4">Overview</Typography>
        <Button startIcon={<RefreshIcon />} onClick={refetch} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && !data && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {data && (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(4, 1fr)',
              },
            }}
          >
            <StatCard label="Users" value={data.users.toLocaleString()} />
            <StatCard
              label="Revenue"
              value={`$${data.revenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            />
            <StatCard label="Open tickets" value={String(data.openTickets)} />
            <StatCard
              label="Recurring schedules"
              value={String(data.activeRecurringSchedules)}
            />
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Deliveries by status
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {DELIVERY_STATUSES.map((status: DeliveryStatus) => {
                  const count = data.deliveriesByStatus[status] ?? 0;
                  return (
                    <Chip
                      key={status}
                      label={`${humanizeEnum(status)}: ${count}`}
                      color={deliveryStatusColor(status)}
                      variant={count > 0 ? 'filled' : 'outlined'}
                      size="small"
                    />
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  );
}
