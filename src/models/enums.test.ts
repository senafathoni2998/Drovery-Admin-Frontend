import { describe, expect, it } from 'vitest';

import { deliveryStatusTone, humanizeEnum } from './enums';

describe('enum helpers', () => {
  it('humanizes UPPER_SNAKE_CASE values', () => {
    expect(humanizeEnum('PICKUP_IN_PROGRESS')).toBe('Pickup in progress');
    expect(humanizeEnum('DELIVERED')).toBe('Delivered');
  });

  it('maps terminal delivery statuses to the right tone', () => {
    expect(deliveryStatusTone('DELIVERED')).toBe('success');
    expect(deliveryStatusTone('DELIVERY_FAILED')).toBe('error');
    expect(deliveryStatusTone('IN_TRANSIT')).toBe('active');
    expect(deliveryStatusTone('CANCELED')).toBe('neutral');
  });
});
