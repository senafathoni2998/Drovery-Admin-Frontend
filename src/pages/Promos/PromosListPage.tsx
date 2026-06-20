import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
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
import { useState } from 'react';

import PromoFormDialog from '../../components/PromoFormDialog';
import { adminApi } from '../../api/admin';
import {
  buildCreateBody,
  buildUpdateBody,
  emptyPromoForm,
  promoToForm,
} from '../../features/promos/promoForm';
import type { PromoFormState } from '../../features/promos/promoForm';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import type { PromoResponse } from '../../models/admin';
import type { Paginated } from '../../models/api';

const LIMIT = 20;

const fmtDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString() : '—';

function discountLabel(p: PromoResponse): string {
  return p.discountType === 'PERCENT'
    ? `${p.discountValue}%`
    : `$${p.discountValue.toFixed(2)}`;
}

function windowLabel(p: PromoResponse): string {
  if (!p.startsAt && !p.endsAt) return 'Always';
  return `${fmtDate(p.startsAt)} → ${fmtDate(p.endsAt)}`;
}

export default function PromosListPage() {
  const [page, setPage] = useState(0);
  const { data, loading, error, refetch } = useApi<Paginated<PromoResponse>>(
    `/admin/promos?page=${page + 1}&limit=${LIMIT}`,
  );

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<PromoFormState>(emptyPromoForm());
  const [editingId, setEditingId] = useState('');

  const createM = useMutation(adminApi.createPromo);
  const updateM = useMutation(adminApi.updatePromo);
  const active = mode === 'create' ? createM : updateM;

  const openCreate = () => {
    createM.reset();
    setMode('create');
    setForm(emptyPromoForm());
    setOpen(true);
  };
  const openEdit = (p: PromoResponse) => {
    updateM.reset();
    setMode('edit');
    setEditingId(p.id);
    setForm(promoToForm(p));
    setOpen(true);
  };

  const submit = async () => {
    if (mode === 'create') {
      if (!(await createM.run(buildCreateBody(form)))) return;
      setOpen(false);
      // New promos sort to page 1 (createdAt desc); jump there so it's visible. setPage
      // changes the useApi key → refetch; only refetch explicitly when already on page 0.
      if (page === 0) refetch();
      else setPage(0);
    } else {
      if (!(await updateM.run(editingId, buildUpdateBody(form)))) return;
      setOpen(false);
      refetch();
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4">Promo codes</Typography>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={refetch} disabled={loading}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New promo
          </Button>
        </Stack>
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
                <TableCell>Code</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Min order</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Redeemed</TableCell>
                <TableCell>Window</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{p.code}</TableCell>
                  <TableCell>{discountLabel(p)}</TableCell>
                  <TableCell>
                    {p.minOrderTotal > 0 ? `$${p.minOrderTotal.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.active ? 'Active' : 'Inactive'}
                      color={p.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {p.timesRedeemed} / {p.maxRedemptions ?? '∞'}
                  </TableCell>
                  <TableCell>{windowLabel(p)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    No promo codes yet.
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

      <PromoFormDialog
        open={open}
        mode={mode}
        form={form}
        onChange={setForm}
        loading={active.loading}
        error={active.error}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      />
    </Stack>
  );
}
