import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DeliveryDetailPage from './DeliveryDetailPage';
import * as fx from '../../test/fixtures';
import { authedAdmin, renderWithProviders } from '../../test/renderWithProviders';

// The api client is the single chokepoint: both the useApi reads (delivery + commands) and the
// adminApi mutations call apiFetch. Mock it once and resolve per-path.
vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
import { apiFetch } from '../../api/client';

const mockFetch = vi.mocked(apiFetch);

/**
 * Resolve the page's two GET reads by path:
 *   /admin/deliveries/:id/commands → [] (empty history)
 *   /admin/deliveries/:id          → the delivery under test
 * Anything else (e.g. a mutation POST) resolves harmlessly to the same delivery.
 */
function mockDelivery(d: ReturnType<typeof fx.delivery>) {
  mockFetch.mockImplementation((path) => {
    if (String(path).endsWith('/commands')) return Promise.resolve([]);
    return Promise.resolve(d);
  });
}

function renderDetail() {
  return renderWithProviders(<DeliveryDetailPage />, {
    preloadedState: authedAdmin(),
    routePath: '/deliveries/:id',
    initialEntries: ['/deliveries/d1'],
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('DeliveryDetailPage — operator-action gating', () => {
  it('(a) SIMULATED IN_TRANSIT: force-cancel + fail enabled, issue-command disabled (not LIVE)', async () => {
    mockDelivery(fx.delivery()); // default: status IN_TRANSIT, trackingSource SIMULATED, no drone

    renderDetail();

    // Wait for the fetch to resolve — the trackingId heading appears once data is present.
    expect(await screen.findByText('DRV-0001')).toBeInTheDocument();

    // Non-terminal → force-cancel enabled.
    expect(
      screen.getByRole('button', { name: /Force cancel/i }),
    ).toBeEnabled();

    // FAILABLE status → fail enabled.
    expect(
      screen.getByRole('button', { name: /Fail delivery/i }),
    ).toBeEnabled();

    // SIMULATED (no live drone) → issuing a drone command is illegal, button disabled.
    expect(
      screen.getByRole('button', { name: /Issue drone command/i }),
    ).toBeDisabled();
  });

  it('(b) terminal DELIVERED: force-cancel + fail both disabled', async () => {
    mockDelivery(fx.delivery({ status: 'DELIVERED' }));

    renderDetail();

    expect(await screen.findByText('DRV-0001')).toBeInTheDocument();

    // Terminal status → nothing destructive is allowed.
    expect(
      screen.getByRole('button', { name: /Force cancel/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Fail delivery/i }),
    ).toBeDisabled();
  });

  it('(c) LIVE + assigned drone + IN_TRANSIT: issue-command enabled', async () => {
    mockDelivery(
      fx.delivery({ trackingSource: 'LIVE', assignedDroneId: 'drone-9' }),
    );

    renderDetail();

    expect(await screen.findByText('DRV-0001')).toBeInTheDocument();

    // LIVE + assigned drone + a returnable/failable status → a command is legal.
    expect(
      screen.getByRole('button', { name: /Issue drone command/i }),
    ).toBeEnabled();
  });

  it('(d) LIVE + assigned + DRONE_ASSIGNED: command dialog does NOT default to the illegal RETURN_TO_BASE', async () => {
    // DRONE_ASSIGNED is FAILABLE (ABORT legal) but NOT in RETURNABLE_STATUSES (RETURN_TO_BASE
    // illegal). The page must default the dropdown to ABORT and disable RETURN_TO_BASE so a
    // blind confirm can't fire a guaranteed-409 RETURN_TO_BASE.
    mockDelivery(
      fx.delivery({
        status: 'DRONE_ASSIGNED',
        trackingSource: 'LIVE',
        assignedDroneId: 'drone-9',
      }),
    );

    renderDetail();

    expect(await screen.findByText('DRV-0001')).toBeInTheDocument();

    const issueBtn = screen.getByRole('button', {
      name: /Issue drone command/i,
    });
    expect(issueBtn).toBeEnabled();

    // Open the command dialog.
    fireEvent.click(issueBtn);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Issue drone command'),
    ).toBeInTheDocument();

    // The "Command" Select is a MUI combobox button showing the current selection as text.
    // It must read "Abort" (the legal default), NOT "Return to base".
    const commandSelect = within(dialog).getByRole('combobox', {
      name: /Command/i,
    });
    expect(commandSelect).toHaveTextContent(/Abort/i);
    expect(commandSelect).not.toHaveTextContent(/Return to base/i);

    // Open the Select; its options render in a portal (query via screen, role 'option').
    fireEvent.mouseDown(commandSelect);

    const returnOption = await screen.findByRole('option', {
      name: /Return to base/i,
    });
    // RETURN_TO_BASE is illegal in DRONE_ASSIGNED → the option is disabled.
    expect(returnOption).toHaveAttribute('aria-disabled', 'true');

    // ABORT is the legal, selected option.
    const abortOption = screen.getByRole('option', { name: /^Abort$/i });
    expect(abortOption).toHaveAttribute('aria-selected', 'true');
    expect(abortOption).not.toHaveAttribute('aria-disabled', 'true');
  });
});
