import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import StatusChip from '../../components/StatusChip';
import { useApi } from '../../hooks/useApi';
import type { AdminDelivery } from '../../models/admin';
import type { Paginated } from '../../models/api';
import type { DeliveryStatus } from '../../models/enums';
import { DELIVERY_STATUSES, humanizeEnum } from '../../models/enums';

const LIMIT = 20;

export default function DeliveriesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0); // 0-based, for TablePagination
  const [status, setStatus] = useState<DeliveryStatus | ''>('');

  const params = new URLSearchParams({
    page: String(page + 1),
    limit: String(LIMIT),
  });
  if (status) params.set('status', status);
  const { data, loading, error, refetch } = useApi<Paginated<AdminDelivery>>(
    `/admin/deliveries?${params.toString()}`,
  );

  const onStatusChange = (e: SelectChangeEvent<DeliveryStatus | ''>) => {
    setStatus(e.target.value as DeliveryStatus | '');
    setPage(0);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Deliveries</Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="status-filter">Status</InputLabel>
          <Select<DeliveryStatus | ''>
            labelId="status-filter"
            label="Status"
            value={status}
            onChange={onStatusChange}
          >
            <MenuItem value="">All</MenuItem>
            {DELIVERY_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {humanizeEnum(s)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tracking ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((d) => (
                <TableRow
                  key={d.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/deliveries/${d.id}`)}
                >
                  <TableCell>{d.trackingId}</TableCell>
                  <TableCell>
                    <StatusChip status={d.status} />
                  </TableCell>
                  <TableCell>{d.trackingSource}</TableCell>
                  <TableCell>
                    {d.user ? (
                      <>
                        <Typography variant="body2">{d.user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.user.email}
                        </Typography>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    ${d.estimatedPrice.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {data && data.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    No deliveries match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {loading && (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={LIMIT}
          rowsPerPageOptions={[LIMIT]}
        />
      </Paper>
    </Stack>
  );
}
