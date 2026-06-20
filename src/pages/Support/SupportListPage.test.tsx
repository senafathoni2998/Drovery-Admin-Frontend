import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders, authedAdmin } from '../../test/renderWithProviders';
import * as fx from '../../test/fixtures';

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
import { apiFetch } from '../../api/client';
import SupportListPage from './SupportListPage';

const mockFetch = vi.mocked(apiFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('SupportListPage', () => {
  it('renders ticket rows: customer names, opening messages, and status chips', async () => {
    mockFetch.mockResolvedValue(
      fx.page([
        fx.ticketListItem(),
        fx.ticketListItem({
          id: 't2',
          status: 'RESOLVED',
          user: { id: 'u2', name: 'Dewi', email: 'dewi@example.com' },
          message: 'where is my refund',
        }),
      ]),
    );

    renderWithProviders(<SupportListPage />, {
      preloadedState: authedAdmin(),
    });

    // (1) both customer names render (async, after the fetch resolves)
    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Dewi')).toBeInTheDocument();

    // (2) the opening message text renders for each ticket
    expect(screen.getByText('My drone never arrived')).toBeInTheDocument();
    expect(screen.getByText('where is my refund')).toBeInTheDocument();

    // (3) status chips render (humanizeEnum: OPEN -> "Open", RESOLVED -> "Resolved")
    expect(screen.getByText(/^Open$/)).toBeInTheDocument();
    expect(screen.getByText(/^Resolved$/)).toBeInTheDocument();
  });
});
