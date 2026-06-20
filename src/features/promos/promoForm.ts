import type {
  CreatePromoBody,
  PromoResponse,
  UpdatePromoBody,
} from '../../models/admin';
import type { PromoDiscountType } from '../../models/enums';

// All numeric/date fields are strings while editing (TextField values); parsed on submit.
export interface PromoFormState {
  code: string;
  description: string;
  discountType: PromoDiscountType;
  discountValue: string;
  minOrderTotal: string;
  maxDiscount: string;
  startsAt: string; // datetime-local ("YYYY-MM-DDTHH:mm"); create-only
  endsAt: string;
  maxRedemptions: string;
  active: boolean;
}

export type PromoFormErrors = Partial<Record<keyof PromoFormState, string>>;

export function emptyPromoForm(): PromoFormState {
  return {
    code: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: '',
    minOrderTotal: '',
    maxDiscount: '',
    startsAt: '',
    endsAt: '',
    maxRedemptions: '',
    active: true,
  };
}

const pad = (n: number): string => String(n).padStart(2, '0');

// ISO instant → local "YYYY-MM-DDTHH:mm" for a datetime-local input (empty when null).
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function promoToForm(p: PromoResponse): PromoFormState {
  return {
    code: p.code,
    description: p.description ?? '',
    discountType: p.discountType,
    discountValue: String(p.discountValue),
    minOrderTotal: String(p.minOrderTotal),
    maxDiscount: p.maxDiscount != null ? String(p.maxDiscount) : '',
    startsAt: isoToLocalInput(p.startsAt),
    endsAt: isoToLocalInput(p.endsAt),
    maxRedemptions: p.maxRedemptions != null ? String(p.maxRedemptions) : '',
    active: p.active,
  };
}

// `num` returns NaN for blank or non-numeric, so callers can distinguish "absent".
const num = (s: string): number => (s.trim() === '' ? NaN : Number(s));

export function validatePromoForm(
  form: PromoFormState,
  mode: 'create' | 'edit',
): PromoFormErrors {
  const errors: PromoFormErrors = {};

  if (mode === 'create') {
    const code = form.code.trim();
    if (!code) errors.code = 'Code is required';
    else if (code.length > 64) errors.code = 'Max 64 characters';
  }

  const value = num(form.discountValue);
  if (Number.isNaN(value) || value <= 0) {
    errors.discountValue = 'Enter a value greater than 0';
  } else if (form.discountType === 'PERCENT' && value > 100) {
    errors.discountValue = 'Percent must be between 0 and 100';
  }

  if (form.minOrderTotal.trim() !== '') {
    const m = num(form.minOrderTotal);
    if (Number.isNaN(m) || m < 0) errors.minOrderTotal = 'Must be 0 or more';
  }
  if (form.maxDiscount.trim() !== '') {
    const m = num(form.maxDiscount);
    if (Number.isNaN(m) || m <= 0) errors.maxDiscount = 'Must be greater than 0';
  }
  if (form.maxRedemptions.trim() !== '') {
    const m = num(form.maxRedemptions);
    if (Number.isNaN(m) || !Number.isInteger(m) || m < 1)
      errors.maxRedemptions = 'Whole number, 1 or more';
  }
  if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
    errors.endsAt = 'End must be after start';
  }

  return errors;
}

const optNum = (s: string): number | undefined =>
  s.trim() === '' ? undefined : Number(s);
const optIso = (local: string): string | undefined =>
  local === '' ? undefined : new Date(local).toISOString();

export function buildCreateBody(form: PromoFormState): CreatePromoBody {
  return {
    code: form.code.trim(),
    description: form.description.trim() || undefined,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderTotal: optNum(form.minOrderTotal),
    maxDiscount: optNum(form.maxDiscount),
    startsAt: optIso(form.startsAt),
    endsAt: optIso(form.endsAt),
    maxRedemptions: optNum(form.maxRedemptions),
  };
}

// Update omits the non-editable fields (code/discountType/startsAt). `description` + `active`
// always reflect the form, so description CAN be cleared (to ''). The numeric/date optionals
// are omitted when blank — the API can't null them, so blank means "keep current value".
export function buildUpdateBody(form: PromoFormState): UpdatePromoBody {
  return {
    description: form.description.trim(),
    discountValue: Number(form.discountValue),
    ...(form.minOrderTotal.trim() !== ''
      ? { minOrderTotal: Number(form.minOrderTotal) }
      : {}),
    ...(form.maxDiscount.trim() !== ''
      ? { maxDiscount: Number(form.maxDiscount) }
      : {}),
    ...(form.endsAt !== '' ? { endsAt: new Date(form.endsAt).toISOString() } : {}),
    ...(form.maxRedemptions.trim() !== ''
      ? { maxRedemptions: Number(form.maxRedemptions) }
      : {}),
    active: form.active,
  };
}
