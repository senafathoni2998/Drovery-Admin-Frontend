import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

import { apiFetch } from '../../api/client';
import * as fx from '../../test/fixtures';
import { authedAdmin, renderWithProviders } from '../../test/renderWithProviders';

import DeliveriesListPage from './DeliveriesListPage';

const mockFetch = vi.mocked(apiFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('DeliveriesListPage', () => {
  it('renders both tracking IDs, status chips, and the customer name after load', async () => {
    mockFetch.mockResolvedValue(
      fx.page([
        fx.delivery({ trackingId: 'DRV-AAA' }),
        fx.delivery({ id: 'd2', trackingId: 'DRV-BBB', status: 'DELIVERED' }),
      ]),
    );

    renderWithProviders(<DeliveriesListPage />, {
      preloadedState: authedAdmin(),
    });

    // (1) both tracking IDs render after the async fetch resolves
    expect(await screen.findByText('DRV-AAA')).toBeInTheDocument();
    expect(screen.getByText('DRV-BBB')).toBeInTheDocument();

    // (2) status chip text appears for each delivery (humanizeEnum of IN_TRANSIT / DELIVERED)
    expect(screen.getByText(/In transit/i)).toBeInTheDocument();
    expect(screen.getByText(/Delivered/i)).toBeInTheDocument();

    // (3) the customer name from the fixture renders
    expect(screen.getAllByText('Budi Santoso').length).toBeGreaterThan(0);
  });

  it('shows the empty-state message when no deliveries match', async () => {
    mockFetch.mockResolvedValue(fx.page([]));

    renderWithProviders(<DeliveriesListPage />, {
      preloadedState: authedAdmin(),
    });

    // (4) empty case renders the explicit no-match copy
    expect(
      await screen.findByText(/No deliveries match this filter\./i),
    ).toBeInTheDocument();
  });
});
