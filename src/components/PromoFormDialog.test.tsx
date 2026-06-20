import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { emptyPromoForm, promoToForm } from '../features/promos/promoForm';
import type { PromoFormState } from '../features/promos/promoForm';
import { renderWithProviders } from '../test/renderWithProviders';
import * as fx from '../test/fixtures';
import PromoFormDialog from './PromoFormDialog';

// PromoFormDialog is a controlled presentational dialog: validity is derived
// from the `form` prop via validatePromoForm(form, mode). The parent owns the
// state, so we exercise the validation/UI branches by passing whole form props
// rather than typing into the controlled inputs.

describe('PromoFormDialog', () => {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    onChange.mockReset();
    onSubmit.mockReset();
    onClose.mockReset();
  });

  function renderDialog(
    over: {
      mode?: 'create' | 'edit';
      form?: PromoFormState;
      loading?: boolean;
      error?: string | null;
    } = {},
  ) {
    const {
      mode = 'create',
      form = emptyPromoForm(),
      loading = false,
      error = null,
    } = over;
    return renderWithProviders(
      <PromoFormDialog
        open
        mode={mode}
        form={form}
        onChange={onChange}
        loading={loading}
        error={error}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
  }

  it('disables "Create promo" for an empty create form (code + value invalid)', () => {
    renderDialog({ mode: 'create', form: emptyPromoForm() });

    const submit = screen.getByRole('button', { name: /Create promo/i });
    expect(submit).toBeInTheDocument();
    expect(submit).toBeDisabled();

    // The two blank-required fields surface their validation messages.
    expect(screen.getByText('Code is required')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a value greater than 0'),
    ).toBeInTheDocument();
  });

  it('enables "Create promo" for a valid create form', () => {
    renderDialog({
      mode: 'create',
      form: { ...emptyPromoForm(), code: 'SAVE', discountValue: '10' },
    });

    const submit = screen.getByRole('button', { name: /Create promo/i });
    expect(submit).toBeEnabled();

    // No validation messages for the now-valid required fields.
    expect(screen.queryByText('Code is required')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Enter a value greater than 0'),
    ).not.toBeInTheDocument();
  });

  it('shows the percent-range error and disables submit when PERCENT value > 100', () => {
    renderDialog({
      mode: 'create',
      form: {
        ...emptyPromoForm(),
        code: 'BIG',
        discountType: 'PERCENT',
        discountValue: '150',
      },
    });

    expect(
      screen.getByText('Percent must be between 0 and 100'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Create promo/i }),
    ).toBeDisabled();
  });

  it('in edit mode: Code field is disabled and an "Active" switch is present', () => {
    renderDialog({ mode: 'edit', form: promoToForm(fx.promo()) });

    // Edit mode renders "Save changes" rather than "Create promo".
    expect(
      screen.getByRole('button', { name: /Save changes/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Create promo/i }),
    ).not.toBeInTheDocument();

    // Code is non-editable in edit mode.
    const codeField = screen.getByLabelText(/^Code$/i);
    expect(codeField).toBeDisabled();

    // The "Active" toggle (a Switch) only renders in edit mode.
    const activeControl = screen.getByLabelText('Active');
    expect(activeControl).toBeInTheDocument();
    expect(activeControl).toHaveAttribute('type', 'checkbox');
    // fx.promo() is active:true → the switch is checked.
    expect(activeControl).toBeChecked();
  });
});
