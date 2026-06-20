// Mirror of the backend Prisma enums (erasableSyntaxOnly forbids TS `enum`, so these are
// string-literal unions + const arrays for stable iteration/labels).

export type Role = 'USER' | 'AGENT' | 'ADMIN';

export type DeliveryStatus =
  | 'SCHEDULED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'DRONE_ASSIGNED'
  | 'PICKUP_IN_PROGRESS'
  | 'IN_TRANSIT'
  | 'AWAITING_HANDOFF'
  | 'DELIVERED'
  | 'CANCELED'
  | 'RETURNING'
  | 'DELIVERY_FAILED'
  | 'RETURNED_TO_BASE';

export type DeliveryFailureReason =
  | 'RECIPIENT_UNAVAILABLE'
  | 'WEATHER_ABORT'
  | 'UNSAFE_DROP_ZONE'
  | 'MECHANICAL'
  | 'ADMIN_ABORT'
  | 'OTHER';

export type DroneCommandType = 'RETURN_TO_BASE' | 'ABORT';

export type DroneCommandStatus =
  | 'PENDING'
  | 'FETCHED'
  | 'ACKED'
  | 'REJECTED'
  | 'EXPIRED';

export type PromoDiscountType = 'PERCENT' | 'FIXED';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// Ordered for stable display (mirrors the lifecycle; exception statuses last).
export const DELIVERY_STATUSES: DeliveryStatus[] = [
  'SCHEDULED',
  'PENDING',
  'CONFIRMED',
  'DRONE_ASSIGNED',
  'PICKUP_IN_PROGRESS',
  'IN_TRANSIT',
  'AWAITING_HANDOFF',
  'DELIVERED',
  'CANCELED',
  'RETURNING',
  'DELIVERY_FAILED',
  'RETURNED_TO_BASE',
];

// Human label for an UPPER_SNAKE enum value (e.g. PICKUP_IN_PROGRESS → "Pickup in progress").
export function humanizeEnum(value: string): string {
  const lower = value.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// Coarse status grouping for color coding.
export type StatusTone = 'neutral' | 'active' | 'success' | 'error' | 'warning';

export function deliveryStatusTone(status: DeliveryStatus): StatusTone {
  switch (status) {
    case 'DELIVERED':
      return 'success';
    case 'DELIVERY_FAILED':
      return 'error';
    case 'CANCELED':
    case 'RETURNED_TO_BASE':
      return 'neutral';
    case 'RETURNING':
    case 'AWAITING_HANDOFF':
      return 'warning';
    case 'SCHEDULED':
      return 'neutral';
    default:
      return 'active';
  }
}
