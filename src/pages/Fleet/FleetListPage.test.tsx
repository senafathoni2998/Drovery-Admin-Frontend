import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FleetListPage from './FleetListPage';
import type { AdminDrone } from '../../models/admin';
import { authedAdmin, renderWithProviders } from '../../test/renderWithProviders';

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
import { apiFetch } from '../../api/client';

const mockFetch = vi.mocked(apiFetch);

const drone = (over: Partial<AdminDrone> = {}): AdminDrone => ({
  id: 'dr-1',
  serial: 'DRV-001',
  model: 'Drovery X1',
  firmwareVersion: null,
  status: 'AVAILABLE',
  airworthy: true,
  maxPayloadKg: 2,
  rangeKm: 18,
  batteryPercent: 96,
  homeBaseLat: -6.9125,
  homeBaseLng: 107.611,
  currentLat: null,
  currentLng: null,
  flightHours: 0,
  flightCycles: 0,
  maintenanceDueAt: null,
  activeDeliveryId: null,
  lastSeenAt: null,
  createdAt: new Date().toISOString(),
  ...over,
});

const page = (items: AdminDrone[]) => ({
  items,
  total: items.length,
  page: 1,
  limit: 20,
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe('FleetListPage', () => {
  it('shows each aircraft with the two numbers dispatch actually reasons about', async () => {
    mockFetch.mockResolvedValue(page([drone()]));

    renderWithProviders(<FleetListPage />, { preloadedState: authedAdmin() });

    expect(await screen.findByText('DRV-001')).toBeInTheDocument();
    expect(screen.getByText('2 kg')).toBeInTheDocument();
    // Range is not decoration: without it an operator cannot tell why a booking was
    // refused, and dispatch's whole out-and-back budget is derived from it.
    expect(screen.getByText('18 km')).toBeInTheDocument();
  });

  it('will not register an aircraft without a range', async () => {
    // The failure this guards: the column has a schema default, so a form that
    // omits range does not error — it silently registers a 12 km aircraft that
    // dispatch then trusts and sends on missions it cannot complete.
    mockFetch.mockResolvedValue(page([]));

    renderWithProviders(<FleetListPage />, { preloadedState: authedAdmin() });

    fireEvent.click(await screen.findByRole('button', { name: /register aircraft/i }));

    fireEvent.change(screen.getByLabelText(/serial/i), { target: { value: 'DRV-002' } });
    fireEvent.change(screen.getByLabelText(/^model/i), { target: { value: 'Drovery X2' } });
    fireEvent.change(screen.getByLabelText(/max payload/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/home base latitude/i), { target: { value: '-6.9' } });
    fireEvent.change(screen.getByLabelText(/home base longitude/i), { target: { value: '107.6' } });

    // Everything else is filled in; range alone is missing.
    const submit = screen.getByRole('button', { name: /^register$/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/range \(km\)/i), { target: { value: '20' } });
    expect(submit).toBeEnabled();
  });

  it('sends the range with the create, not just collects it', async () => {
    mockFetch.mockResolvedValue(page([]));

    renderWithProviders(<FleetListPage />, { preloadedState: authedAdmin() });

    fireEvent.click(await screen.findByRole('button', { name: /register aircraft/i }));
    fireEvent.change(screen.getByLabelText(/serial/i), { target: { value: 'DRV-002' } });
    fireEvent.change(screen.getByLabelText(/^model/i), { target: { value: 'Drovery X2' } });
    fireEvent.change(screen.getByLabelText(/max payload/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/range \(km\)/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/home base latitude/i), { target: { value: '-6.9' } });
    fireEvent.change(screen.getByLabelText(/home base longitude/i), { target: { value: '107.6' } });

    mockFetch.mockClear();
    mockFetch.mockResolvedValue(drone());
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    const [, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(String((init as { body?: unknown }).body))).toMatchObject({
      serial: 'DRV-002',
      maxPayloadKg: 3,
      rangeKm: 20,
    });
  });
});
