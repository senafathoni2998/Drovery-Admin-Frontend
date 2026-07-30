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
import { Link, useNavigate } from 'react-router';

import StatusChip from '../../components/StatusChip';
import SearchField from '../../components/SearchField';
import { useListParams, toQueryString } from '../../hooks/useListParams';
import { useApi } from '../../hooks/useApi';
import type { AdminDelivery } from '../../models/admin';
import type { Paginated } from '../../models/api';
import type { DeliveryStatus } from '../../models/enums';
import { DELIVERY_STATUSES, humanizeEnum } from '../../models/enums';

const LIMIT = 20;

export default function DeliveriesListPage() {
  const navigate = useNavigate();
  // Page + filter + search live in the URL, so going back from a record keeps the
  // queue you were working and the view is shareable.
  const { page, q, filter, setPage, setQ, setFilter } = useListParams();
  const status = filter as DeliveryStatus | '';

  const { data, loading, error, refetch } = useApi<Paginated<AdminDelivery>>(
    `/admin/deliveries?${toQueryString(page, LIMIT, q, 'status', status)}`,
  );

  const onStatusChange = (e: SelectChangeEvent<DeliveryStatus | ''>) => {
    setFilter(e.target.value as string);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Deliveries</Typography>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <SearchField
          value={q}
          onChange={setQ}
          placeholder="Tracking ID, address, receiver or customer email"
        />
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
                <TableRow key={d.id} hover sx={{ cursor: 'pointer' }}>
                  {/* The id cell is a real anchor: keyboard-reachable, and
                      middle/ctrl-click opens the record in a new tab. The row
                      stays clickable for the mouse. */}
                  <TableCell onClick={() => navigate(`/deliveries/${d.id}`)}>
                    <Link
                      to={`/deliveries/${d.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'inherit', fontWeight: 600 }}
                    >
                      {d.trackingId}
                    </Link>
                  </TableCell>
                  <TableCell onClick={() => navigate(`/deliveries/${d.id}`)}>
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
