import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Chip,
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

import { useApi } from '../../hooks/useApi';
import type { AdminSupportTicketListItem } from '../../models/admin';
import type { Paginated } from '../../models/api';
import type { SupportTicketStatus } from '../../models/enums';
import {
  SUPPORT_TICKET_STATUSES,
  humanizeEnum,
  ticketStatusColor,
} from '../../models/enums';

const LIMIT = 20;

export default function SupportListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<SupportTicketStatus | ''>('');

  const params = new URLSearchParams({
    page: String(page + 1),
    limit: String(LIMIT),
  });
  if (status) params.set('status', status);
  const { data, loading, error, refetch } = useApi<
    Paginated<AdminSupportTicketListItem>
  >(`/admin/support/tickets?${params.toString()}`);

  const onStatusChange = (e: SelectChangeEvent<SupportTicketStatus | ''>) => {
    setStatus(e.target.value as SupportTicketStatus | '');
    setPage(0);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Support inbox</Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="ticket-status">Status</InputLabel>
          <Select<SupportTicketStatus | ''>
            labelId="ticket-status"
            label="Status"
            value={status}
            onChange={onStatusChange}
          >
            <MenuItem value="">All</MenuItem>
            {SUPPORT_TICKET_STATUSES.map((s) => (
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
                <TableCell>Customer</TableCell>
                <TableCell>Opening message</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last activity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/support/${t.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2">{t.user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.user.email}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 360,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.message}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={humanizeEnum(t.status)}
                      color={ticketStatusColor(t.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(t.lastMessageAt ?? t.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {data && data.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    No tickets match this filter.
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
