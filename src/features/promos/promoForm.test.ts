import { describe, expect, it } from 'vitest';

import type { PromoResponse } from '../../models/admin';
import {
  buildCreateBody,
  buildUpdateBody,
  emptyPromoForm,
  isoToLocalInput,
  promoToForm,
  validatePromoForm,
} from './promoForm';

describe('validatePromoForm', () => {
  it('requires a code on create and a positive discount value', () => {
    const e = validatePromoForm(emptyPromoForm(), 'create');
    expect(e.code).toBeDefined();
    expect(e.discountValue).toBeDefined();
  });

  it('does not require a code on edit', () => {
    const e = validatePromoForm(
      { ...emptyPromoForm(), discountValue: '10' },
      'edit',
    );
    expect(e.code).toBeUndefined();
    expect(e.discountValue).toBeUndefined();
  });

  it('caps PERCENT at 100 but allows larger FIXED amounts', () => {
    const percent = validatePromoForm(
      { ...emptyPromoForm(), discountType: 'PERCENT', discountValue: '150' },
      'create',
    );
    expect(percent.discountValue).toBeDefined();
    const fixed = validatePromoForm(
      {
        ...emptyPromoForm(),
        code: 'SAVE',
        discountType: 'FIXED',
        discountValue: '150',
      },
      'create',
    );
    expect(fixed.discountValue).toBeUndefined();
  });

  it('rejects a fractional maxRedemptions and an end before start', () => {
    const e = validatePromoForm(
      {
        ...emptyPromoForm(),
        code: 'X',
        discountValue: '5',
        discountType: 'FIXED',
        maxRedemptions: '2.5',
        startsAt: '2026-06-20T12:00',
        endsAt: '2026-06-20T10:00',
      },
      'create',
    );
    expect(e.maxRedemptions).toBeDefined();
    expect(e.endsAt).toBeDefined();
  });
});

describe('buildCreateBody', () => {
  it('parses numbers, omits blank optionals, and ISO-encodes dates', () => {
    const body = buildCreateBody({
      ...emptyPromoForm(),
      code: 'welcome10',
      discountType: 'PERCENT',
      discountValue: '10',
      maxDiscount: '5',
      maxRedemptions: '1000',
    });
    expect(body).toMatchObject({
      code: 'welcome10',
      discountType: 'PERCENT',
      discountValue: 10,
      maxDiscount: 5,
      maxRedemptions: 1000,
    });
    // blank optionals are absent, not 0/empty-string
    expect(body.minOrderTotal).toBeUndefined();
    expect(body.startsAt).toBeUndefined();
    expect(body.description).toBeUndefined();
  });

  it('ISO-encodes a provided datetime-local value', () => {
    const body = buildCreateBody({
      ...emptyPromoForm(),
      code: 'X',
      discountType: 'FIXED',
      discountValue: '5',
      endsAt: '2026-12-31T23:59',
    });
    expect(body.endsAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(new Date(body.endsAt as string).getFullYear()).toBe(2026);
  });
});

const samplePromo: PromoResponse = {
  id: 'pr1',
  code: 'WELCOME10',
  description: '10% off',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderTotal: 0,
  maxDiscount: 5,
  startsAt: null,
  endsAt: '2026-12-31T23:59:00.000Z',
  active: true,
  maxRedemptions: 1000,
  timesRedeemed: 3,
  perUserLimit: 1,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('buildUpdateBody', () => {
  it('never emits the non-editable fields (code/discountType/startsAt)', () => {
    const body = buildUpdateBody(promoToForm(samplePromo));
    expect('code' in body).toBe(false);
    expect('discountType' in body).toBe(false);
    expect('startsAt' in body).toBe(false);
    // editable fields round-trip as numbers/strings/booleans
    expect(body).toMatchObject({
      discountValue: 10,
      maxDiscount: 5,
      maxRedemptions: 1000,
      active: true,
    });
  });

  it('omits blank numeric/date optionals but always sends description + active', () => {
    const form = promoToForm(samplePromo);
    const body = buildUpdateBody({
      ...form,
      maxDiscount: '',
      maxRedemptions: '',
      endsAt: '',
      description: '',
      active: false,
    });
    expect('maxDiscount' in body).toBe(false);
    expect('maxRedemptions' in body).toBe(false);
    expect('endsAt' in body).toBe(false);
    expect(body.description).toBe(''); // description CAN be cleared
    expect(body.active).toBe(false);
  });
});

describe('isoToLocalInput', () => {
  it('returns empty for null and a datetime-local string otherwise', () => {
    expect(isoToLocalInput(null)).toBe('');
    expect(isoToLocalInput('2026-12-31T23:59:00.000Z')).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    );
  });

  it('round-trips a value back to the same instant (minute precision)', () => {
    const local = isoToLocalInput('2026-12-31T23:59:00.000Z');
    // datetime-local is local time; re-encoding must land on the same UTC minute.
    expect(new Date(local).toISOString()).toBe('2026-12-31T23:59:00.000Z');
  });
});
