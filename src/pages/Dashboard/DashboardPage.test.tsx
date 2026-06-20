import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage from './DashboardPage';
import * as fx from '../../test/fixtures';
import { authedAdmin, renderWithProviders } from '../../test/renderWithProviders';

// The api client is the single chokepoint — useApi('/admin/overview') goes through apiFetch.
vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
import { apiFetch } from '../../api/client';

const mockFetch = vi.mocked(apiFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('DashboardPage', () => {
  it('shows a spinner before the overview fetch resolves', () => {
    // A never-resolving promise keeps the page in its loading state.
    mockFetch.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<DashboardPage />, { preloadedState: authedAdmin() });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the stat values and a deliveries-by-status chip after the fetch resolves', async () => {
    mockFetch.mockResolvedValue(fx.overview());

    renderWithProviders(<DashboardPage />, { preloadedState: authedAdmin() });

    // Users stat: 1234 -> "1,234" via toLocaleString.
    expect(await screen.findByText('1,234')).toBeInTheDocument();

    // Open tickets stat value (5). Assert against the labelled card to avoid clashing
    // with other numbers that may appear in chips.
    const openTicketsLabel = screen.getByText('Open tickets');
    const openTicketsCard = openTicketsLabel.closest('.MuiCard-root') as HTMLElement;
    expect(openTicketsCard).not.toBeNull();
    expect(within(openTicketsCard).getByText('5')).toBeInTheDocument();

    // A deliveries-by-status chip, e.g. "Delivered: 800".
    expect(screen.getByText(/Delivered: 800/)).toBeInTheDocument();

    // Spinner is gone once data is present.
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows an error alert with a Retry action when the fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('boom'));

    renderWithProviders(<DashboardPage />, { preloadedState: authedAdmin() });

    // useApi maps non-ApiError rejections to the generic message.
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Something went wrong/i);

    // The Retry button lives in the alert action.
    expect(
      screen.getByRole('button', { name: /Retry/i }),
    ).toBeInTheDocument();

    // No stats card rendered when there is no data.
    expect(screen.queryByText('1,234')).not.toBeInTheDocument();
  });
});
