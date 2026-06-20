import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

import { renderWithProviders } from '../test/renderWithProviders';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    onConfirm.mockReset();
    onClose.mockReset();
  });

  it('renders the title and a passed child when open', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Force cancel delivery"
        onConfirm={onConfirm}
        onClose={onClose}
      >
        <div>FORM</div>
      </ConfirmDialog>,
    );

    expect(screen.getByText('Force cancel delivery')).toBeInTheDocument();
    expect(screen.getByText('FORM')).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Confirm action"
        confirmLabel="Force cancel"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /Force cancel/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses the default "Confirm" label when none is provided', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Confirm action"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole('button', { name: /^Confirm$/i }),
    ).toBeInTheDocument();
  });

  it('disables the confirm button when disabled=true', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Confirm action"
        confirmLabel="Approve"
        disabled
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('button', { name: /Approve/i })).toBeDisabled();
  });

  it('disables the confirm button and shows "Working…" when loading=true', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Confirm action"
        confirmLabel="Approve"
        loading
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    // While loading the label becomes "Working…", so query by that name.
    const workingBtn = screen.getByRole('button', { name: /Working…/ });
    expect(workingBtn).toBeInTheDocument();
    expect(workingBtn).toBeDisabled();
    // The original confirm label is no longer rendered.
    expect(
      screen.queryByRole('button', { name: /Approve/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the error string as an alert', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Confirm action"
        error="Something went wrong"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Something went wrong');
  });

  it('does not render the title when open=false', () => {
    renderWithProviders(
      <ConfirmDialog
        open={false}
        title="Hidden title"
        onConfirm={onConfirm}
        onClose={onClose}
      >
        <div>FORM</div>
      </ConfirmDialog>,
    );

    expect(screen.queryByText('Hidden title')).not.toBeInTheDocument();
    expect(screen.queryByText('FORM')).not.toBeInTheDocument();
  });
});
