import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';

import { renderWithProviders, authedAdmin } from '../../test/renderWithProviders';
import * as fx from '../../test/fixtures';
import PromosListPage from './PromosListPage';

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
import { apiFetch } from '../../api/client';
const mockFetch = vi.mocked(apiFetch);

const promosPage = () =>
  fx.page([
    fx.promo(),
    fx.promo({ id: 'pr2', code: 'DRONE5', discountType: 'FIXED', discountValue: 5 }),
  ]);

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((path) => {
    if (String(path).startsWith('/admin/promos')) {
      return Promise.resolve(promosPage());
    }
    return Promise.resolve(fx.page([]));
  });
});

describe('PromosListPage', () => {
  it('renders both promo codes after load', async () => {
    renderWithProviders(<PromosListPage />, { preloadedState: authedAdmin() });

    expect(await screen.findByText('WELCOME10')).toBeInTheDocument();
    expect(await screen.findByText('DRONE5')).toBeInTheDocument();
  });

  it('renders the discount labels for each promo', async () => {
    renderWithProviders(<PromosListPage />, { preloadedState: authedAdmin() });

    // PERCENT → "10%", FIXED → "$5.00"
    expect(await screen.findByText('10%')).toBeInTheDocument();
    expect(await screen.findByText(/\$5/)).toBeInTheDocument();
  });

  it('opens the create dialog when "New promo" is clicked', async () => {
    renderWithProviders(<PromosListPage />, { preloadedState: authedAdmin() });

    // Wait for load so the page is interactive.
    await screen.findByText('WELCOME10');

    fireEvent.click(screen.getByRole('button', { name: /New promo/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('New promo code')).toBeInTheDocument();
  });

  it('opens the edit dialog titled "Edit WELCOME10" when a row\'s Edit is clicked', async () => {
    renderWithProviders(<PromosListPage />, { preloadedState: authedAdmin() });

    const codeCell = await screen.findByText('WELCOME10');
    const row = codeCell.closest('tr');
    expect(row).not.toBeNull();

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: /Edit/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Edit WELCOME10/)).toBeInTheDocument();
  });
});
