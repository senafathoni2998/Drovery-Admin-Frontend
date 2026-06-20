import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';

import { renderWithProviders, authedAdmin } from '../../test/renderWithProviders';
import * as fx from '../../test/fixtures';
import UsersListPage from './UsersListPage';

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
import { apiFetch } from '../../api/client';
const mockFetch = vi.mocked(apiFetch);

const usersPage = () =>
  fx.page([
    fx.userRow(),
    fx.userRow({
      id: 'u2',
      name: 'Dewi',
      email: 'dewi@example.com',
      role: 'ADMIN',
    }),
  ]);

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((path) => {
    if (String(path).startsWith('/admin/users')) {
      return Promise.resolve(usersPage());
    }
    return Promise.resolve(fx.page([]));
  });
});

describe('UsersListPage', () => {
  it('renders both user names after load', async () => {
    renderWithProviders(<UsersListPage />, { preloadedState: authedAdmin() });

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    expect(await screen.findByText('Dewi')).toBeInTheDocument();
  });

  it('renders a role chip per user (USER + ADMIN)', async () => {
    renderWithProviders(<UsersListPage />, { preloadedState: authedAdmin() });

    // Scope the role assertions to each user's row so the Role-filter Select
    // (also rendering its current value as text) cannot satisfy the query.
    const budiRow = (await screen.findByText('Budi Santoso')).closest('tr');
    const dewiRow = (await screen.findByText('Dewi')).closest('tr');
    expect(budiRow).not.toBeNull();
    expect(dewiRow).not.toBeNull();

    expect(within(budiRow as HTMLElement).getByText('USER')).toBeInTheDocument();
    expect(within(dewiRow as HTMLElement).getByText('ADMIN')).toBeInTheDocument();
  });

  it('opens the change-role dialog titled with the user name when "Change role" is clicked', async () => {
    renderWithProviders(<UsersListPage />, { preloadedState: authedAdmin() });

    const nameCell = await screen.findByText('Budi Santoso');
    const row = nameCell.closest('tr');
    expect(row).not.toBeNull();

    fireEvent.click(
      within(row as HTMLElement).getByRole('button', { name: /Change role/i }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Change role/)).toBeInTheDocument();
    // Title is `Change role — ${name}`; assert the user's name is in the title.
    expect(within(dialog).getByText(/Budi Santoso/)).toBeInTheDocument();
  });

  it('disables "Save role" initially because the selected role equals the current role', async () => {
    renderWithProviders(<UsersListPage />, { preloadedState: authedAdmin() });

    const nameCell = await screen.findByText('Budi Santoso');
    const row = nameCell.closest('tr');
    expect(row).not.toBeNull();

    fireEvent.click(
      within(row as HTMLElement).getByRole('button', { name: /Change role/i }),
    );

    const dialog = await screen.findByRole('dialog');
    const save = within(dialog).getByRole('button', { name: /Save role/i });
    expect(save).toBeDisabled();
  });
});
