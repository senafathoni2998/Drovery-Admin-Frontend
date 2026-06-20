import { describe, expect, it } from 'vitest';

import type { AdminDelivery } from '../../models/admin';
import { deliveryActions } from './deliveryActions';

const base: AdminDelivery = {
  id: 'd1',
  trackingId: 'DRV-1',
  userId: 'u1',
  status: 'IN_TRANSIT',
  trackingSource: 'SIMULATED',
  assignedDroneId: null,
  failureReason: null,
  fromAddress: 'a',
  toAddress: 'b',
  fromLat: null,
  fromLng: null,
  toLat: null,
  toLng: null,
  receiver: 'r',
  packages: 'p',
  packageSize: 'Small',
  packageWeight: 1,
  packageTypes: ['document'],
  pickupDate: '2026-06-20',
  pickupTime: '10:00 AM',
  scheduledFor: null,
  estimatedDelivery: null,
  estimatedPrice: 10,
  handoffConfirmedAt: null,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

describe('deliveryActions', () => {
  it('enables cancel + fail for an in-flight delivery, command only when LIVE+assigned', () => {
    expect(deliveryActions({ ...base, status: 'IN_TRANSIT' })).toMatchObject({
      canForceCancel: true,
      canFail: true,
      canIssueCommand: false, // SIMULATED
    });
    expect(
      deliveryActions({
        ...base,
        status: 'IN_TRANSIT',
        trackingSource: 'LIVE',
        assignedDroneId: 'drone-9',
      }),
    ).toMatchObject({ canIssueCommand: true });
  });

  it('disables everything destructive on a terminal delivery', () => {
    const a = deliveryActions({ ...base, status: 'DELIVERED' });
    expect(a.canForceCancel).toBe(false);
    expect(a.canFail).toBe(false);
    expect(a.canIssueCommand).toBe(false);
  });

  it('allows force-cancel but not fail before the drone is assigned', () => {
    const a = deliveryActions({ ...base, status: 'CONFIRMED' });
    expect(a.canForceCancel).toBe(true);
    expect(a.canFail).toBe(false);
  });

  it('gates RETURN_TO_BASE narrower than ABORT (per-command legality)', () => {
    const live = {
      ...base,
      trackingSource: 'LIVE' as const,
      assignedDroneId: 'drone-9',
    };
    expect(deliveryActions({ ...live, status: 'IN_TRANSIT' })).toMatchObject({
      canReturnToBase: true,
      canAbort: true,
      canIssueCommand: true,
    });
    // DRONE_ASSIGNED + RETURNING are failable (ABORT ok) but NOT returnable.
    expect(deliveryActions({ ...live, status: 'DRONE_ASSIGNED' })).toMatchObject({
      canReturnToBase: false,
      canAbort: true,
      canIssueCommand: true,
    });
    expect(deliveryActions({ ...live, status: 'RETURNING' })).toMatchObject({
      canReturnToBase: false,
      canAbort: true,
      canIssueCommand: true,
    });
  });

  it('allows refund unless already refunded (goodwill credit otherwise)', () => {
    expect(deliveryActions(base).canRefund).toBe(true); // no payment → goodwill credit ok
    const withPayment = (status: 'COMPLETED' | 'REFUNDED') =>
      deliveryActions({
        ...base,
        payment: {
          id: 'p1',
          deliveryId: 'd1',
          stripePaymentIntentId: null,
          amount: 10,
          currency: 'usd',
          status,
          createdAt: base.createdAt,
        },
      }).canRefund;
    expect(withPayment('COMPLETED')).toBe(true);
    expect(withPayment('REFUNDED')).toBe(false);
  });
});
