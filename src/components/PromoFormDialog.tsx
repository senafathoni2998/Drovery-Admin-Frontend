import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material';

import type { PromoFormState } from '../features/promos/promoForm';
import { validatePromoForm } from '../features/promos/promoForm';
import type { PromoDiscountType } from '../models/enums';

interface PromoFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  form: PromoFormState;
  onChange: (form: PromoFormState) => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
}

export default function PromoFormDialog({
  open,
  mode,
  form,
  onChange,
  loading,
  error,
  onSubmit,
  onClose,
}: PromoFormDialogProps) {
  const errors = validatePromoForm(form, mode);
  const hasErrors = Object.keys(errors).length > 0;
  const isEdit = mode === 'edit';

  const set = <K extends keyof PromoFormState>(key: K, value: PromoFormState[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{isEdit ? `Edit ${form.code}` : 'New promo code'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Code"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            disabled={isEdit}
            error={!!errors.code}
            helperText={errors.code ?? (isEdit ? 'Code cannot be changed' : 'Stored uppercase')}
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ minWidth: 140 }} disabled={isEdit}>
              <InputLabel id="discount-type">Type</InputLabel>
              <Select<PromoDiscountType>
                labelId="discount-type"
                label="Type"
                value={form.discountType}
                onChange={(e) =>
                  set('discountType', e.target.value as PromoDiscountType)
                }
              >
                <MenuItem value="PERCENT">Percent</MenuItem>
                <MenuItem value="FIXED">Fixed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Value"
              type="number"
              value={form.discountValue}
              onChange={(e) => set('discountValue', e.target.value)}
              error={!!errors.discountValue}
              helperText={errors.discountValue}
              slotProps={{
                input:
                  form.discountType === 'PERCENT'
                    ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                    : { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              }}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Min order total"
              type="number"
              value={form.minOrderTotal}
              onChange={(e) => set('minOrderTotal', e.target.value)}
              error={!!errors.minOrderTotal}
              helperText={errors.minOrderTotal ?? 'Optional · 0 = no minimum'}
              fullWidth
            />
            <TextField
              label="Max discount"
              type="number"
              value={form.maxDiscount}
              onChange={(e) => set('maxDiscount', e.target.value)}
              error={!!errors.maxDiscount}
              helperText={errors.maxDiscount ?? 'Optional cap'}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            {!isEdit && (
              <TextField
                label="Starts at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            )}
            <TextField
              label="Ends at"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set('endsAt', e.target.value)}
              error={!!errors.endsAt}
              helperText={errors.endsAt}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Max redemptions"
            type="number"
            value={form.maxRedemptions}
            onChange={(e) => set('maxRedemptions', e.target.value)}
            error={!!errors.maxRedemptions}
            helperText={errors.maxRedemptions ?? 'Optional · blank = unlimited'}
            fullWidth
          />
          {isEdit && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                />
              }
              label="Active"
            />
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading || hasErrors}
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create promo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
