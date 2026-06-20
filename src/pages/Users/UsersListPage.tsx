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

import ConfirmDialog from '../../components/ConfirmDialog';
import { adminApi } from '../../api/admin';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import type { AdminUserListItem } from '../../models/admin';
import type { Paginated } from '../../models/api';
import type { Role } from '../../models/enums';
import { ROLES, roleColor } from '../../models/enums';

const LIMIT = 20;

export default function UsersListPage() {
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');

  const params = new URLSearchParams({
    page: String(page + 1),
    limit: String(LIMIT),
  });
  if (roleFilter) params.set('role', roleFilter);
  const { data, loading, error, refetch } = useApi<Paginated<AdminUserListItem>>(
    `/admin/users?${params.toString()}`,
  );

  const [editing, setEditing] = useState<AdminUserListItem | null>(null);
  const [newRole, setNewRole] = useState<Role>('USER');
  const setRoleM = useMutation(adminApi.setRole);

  const openEdit = (u: AdminUserListItem) => {
    setRoleM.reset();
    setEditing(u);
    setNewRole(u.role);
  };

  const submitRole = async () => {
    if (!editing) return;
    if (await setRoleM.run(editing.id, newRole)) {
      refetch();
      setEditing(null);
    }
  };

  const onFilterChange = (e: SelectChangeEvent<Role | ''>) => {
    setRoleFilter(e.target.value as Role | '');
    setPage(0);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Users</Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="role-filter">Role</InputLabel>
          <Select<Role | ''>
            labelId="role-filter"
            label="Role"
            value={roleFilter}
            onChange={onFilterChange}
          >
            <MenuItem value="">All</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
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
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={u.role} color={roleColor(u.role)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEdit(u)}>
                      Change role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    No users match this filter.
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

      <ConfirmDialog
        open={!!editing}
        title={editing ? `Change role — ${editing.name}` : 'Change role'}
        description="Role changes take effect immediately (the server re-resolves it on every request)."
        confirmLabel="Save role"
        loading={setRoleM.loading}
        error={setRoleM.error}
        disabled={!editing || newRole === editing.role}
        onConfirm={submitRole}
        onClose={() => setEditing(null)}
      >
        <FormControl fullWidth size="small">
          <InputLabel id="new-role">Role</InputLabel>
          <Select<Role>
            labelId="new-role"
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </ConfirmDialog>
    </Stack>
  );
}
