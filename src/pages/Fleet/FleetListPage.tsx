import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { ChangeEvent } from 'react';
import { useState } from 'react';

import PageLoader from '../../components/PageLoader';
import SearchField from '../../components/SearchField';
import { fleetApi } from '../../api/admin';
import { useApi } from '../../hooks/useApi';
import { useListParams, toQueryString } from '../../hooks/useListParams';
import { useMutation } from '../../hooks/useMutation';
import type { AdminDrone } from '../../models/admin';
import type { Paginated } from '../../models/api';
import type { DroneStatus } from '../../models/enums';
import { DRONE_STATUSES } from '../../models/enums';

const LIMIT = 20;

/** Status colour is advisory only — the label carries the meaning. */
const STATUS_COLOR: Record<DroneStatus, 'success' | 'info' | 'warning' | 'default'> =
  {
    AVAILABLE: 'success',
    IN_FLIGHT: 'info',
    CHARGING: 'default',
    MAINTENANCE: 'warning',
    GROUNDED: 'warning',
  };

const EMPTY_FORM = {
  serial: '',
  model: '',
  maxPayloadKg: '',
  rangeKm: '',
  homeBaseLat: '',
  homeBaseLng: '',
};

/**
 * The fleet registry.
 *
 * This page is what makes a LIVE delivery possible at all. `Delivery.assignedDroneId`
 * is a foreign key and the backend claims the aircraft atomically, so with an empty
 * registry there is simply nothing to claim — every LIVE create is refused. There was
 * previously no way to register an aircraft from anywhere.
 */
export default function FleetListPage() {
  const { page, q, filter, setPage, setQ, setFilter } = useListParams();
  const status = filter as DroneStatus | '';

  const { data, loading, error, refetch } = useApi<Paginated<AdminDrone>>(
    `/admin/drones?${toQueryString(page, LIMIT, q, 'status', status)}`,
  );

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const createM = useMutation(fleetApi.create);
  const updateM = useMutation(fleetApi.update);

  const field = (k: keyof typeof EMPTY_FORM) => ({
    value: form[k],
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  const canSubmit =
    form.serial.trim() !== '' &&
    form.model.trim() !== '' &&
    Number(form.maxPayloadKg) > 0 &&
    Number(form.rangeKm) > 0 &&
    form.homeBaseLat !== '' &&
    form.homeBaseLng !== '';

  const onCreate = async () => {
    const ok = await createM.run({
      serial: form.serial.trim(),
      model: form.model.trim(),
      maxPayloadKg: Number(form.maxPayloadKg),
      rangeKm: Number(form.rangeKm),
      homeBaseLat: Number(form.homeBaseLat),
      homeBaseLng: Number(form.homeBaseLng),
    });
    if (ok) {
      setAdding(false);
      setForm(EMPTY_FORM);
      refetch();
    }
  };

  /**
   * Grounding clears a DISPATCH precondition, so it stops the NEXT claim. It does not
   * recall an aircraft already in the air — that is a RETURN_TO_BASE command, with
   * different safety semantics. The button says so rather than implying a recall.
   */
  const onToggleAirworthy = async (d: AdminDrone) => {
    if (await updateM.run(d.id, { airworthy: !d.airworthy })) refetch();
  };

  const onStatusFilter = (e: SelectChangeEvent<DroneStatus | ''>) =>
    setFilter(e.target.value as string);

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h4">Fleet</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<RefreshIcon />} onClick={refetch} disabled={loading}>
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            createM.reset();
            setAdding(true);
          }}
        >
          Register aircraft
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <SearchField value={q} onChange={setQ} placeholder="Serial or model" />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="drone-status">Status</InputLabel>
          <Select<DroneStatus | ''>
            labelId="drone-status"
            label="Status"
            value={status}
            onChange={onStatusFilter}
          >
            <MenuItem value="">All</MenuItem>
            {DRONE_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {updateM.error && <Alert severity="error">{updateM.error}</Alert>}

      {loading && !data ? (
        <PageLoader />
      ) : data && data.items.length === 0 ? (
        <Alert severity="info">
          No aircraft registered. A LIVE delivery binds a real airframe, so it will be
          refused until at least one is registered here. Simulated deliveries are
          unaffected.
        </Alert>
      ) : (
        <Paper variant="outlined">
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Serial</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Airworthy</TableCell>
                  <TableCell align="right">Max payload</TableCell>
                  <TableCell align="right">Range</TableCell>
                  <TableCell align="right">Battery</TableCell>
                  <TableCell>Active delivery</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.items.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{d.serial}</TableCell>
                    <TableCell>{d.model}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={d.status}
                        color={STATUS_COLOR[d.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={d.airworthy ? 'success' : 'error'}
                        label={d.airworthy ? 'Airworthy' : 'Grounded'}
                      />
                    </TableCell>
                    <TableCell align="right">{d.maxPayloadKg} kg</TableCell>
                    <TableCell align="right">{d.rangeKm} km</TableCell>
                    <TableCell align="right">{d.batteryPercent}%</TableCell>
                    <TableCell>
                      {d.activeDeliveryId ? (
                        <Typography variant="body2" fontFamily="monospace">
                          {d.activeDeliveryId.slice(0, 8)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color={d.airworthy ? 'error' : 'success'}
                        disabled={updateM.loading}
                        onClick={() => onToggleAirworthy(d)}
                      >
                        {d.airworthy ? 'Ground' : 'Return to service'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data?.total ?? 0}
            page={page}
            rowsPerPage={LIMIT}
            rowsPerPageOptions={[LIMIT]}
            onPageChange={(_, p) => setPage(p)}
          />
        </Paper>
      )}

      <Dialog open={adding} onClose={() => setAdding(false)} fullWidth maxWidth="sm">
        <DialogTitle>Register aircraft</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {createM.error && <Alert severity="error">{createM.error}</Alert>}
            <TextField
              label="Serial"
              helperText="The physical marking on the airframe. Must be unique."
              size="small"
              {...field('serial')}
            />
            <TextField label="Model" size="small" {...field('model')} />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Max payload (kg)"
                type="number"
                size="small"
                fullWidth
                helperText="Dispatch refuses any package heavier than this."
                {...field('maxPayloadKg')}
              />
              <TextField
                label="Range (km)"
                type="number"
                size="small"
                fullWidth
                helperText="Still-air range at full charge. Dispatch spends only part of it: it derates for state of charge and payload, holds a reserve back, and must fit the whole out-and-back trip."
                {...field('rangeKm')}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Home base latitude"
                type="number"
                size="small"
                fullWidth
                {...field('homeBaseLat')}
              />
              <TextField
                label="Home base longitude"
                type="number"
                size="small"
                fullWidth
                {...field('homeBaseLng')}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdding(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onCreate}
            disabled={!canSubmit || createM.loading}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
