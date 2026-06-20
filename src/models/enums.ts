// Mirror of the backend Prisma enums (erasableSyntaxOnly forbids TS `enum`, so these are
// string-literal unions + const arrays for stable iteration/labels).

export type Role = 'USER' | 'AGENT' | 'ADMIN';

export const ROLES: Role[] = ['USER', 'AGENT', 'ADMIN'];

export function roleColor(role: Role): 'default' | 'info' | 'primary' {
  if (role === 'ADMIN') return 'primary';
  if (role === 'AGENT') return 'info';
  return 'default';
}

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

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

export type SupportChatSenderRole = 'USER' | 'AGENT' | 'SYSTEM';

export function ticketStatusColor(
  status: SupportTicketStatus,
): 'info' | 'warning' | 'success' | 'default' {
  switch (status) {
    case 'OPEN':
      return 'info';
    case 'IN_PROGRESS':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    case 'CLOSED':
      return 'default';
  }
}

export type TrackingSource = 'SIMULATED' | 'LIVE';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

// Mirrors src/deliveries/delivery-exceptions.ts — the backend's CAS gating for admin actions.
// force-cancel: status NOT in TERMINAL; fail / drone-command: status in FAILABLE.
export const TERMINAL_STATUSES: DeliveryStatus[] = [
  'DELIVERED',
  'CANCELED',
  'DELIVERY_FAILED',
  'RETURNED_TO_BASE',
];

export const FAILABLE_STATUSES: DeliveryStatus[] = [
  'DRONE_ASSIGNED',
  'PICKUP_IN_PROGRESS',
  'IN_TRANSIT',
  'AWAITING_HANDOFF',
  'RETURNING',
];

// RETURN_TO_BASE is legal on a NARROWER set than ABORT (which is failable). Mirrors
// command.constants.ts COMMAND_TYPE_TO_LEGAL_STATUSES — excludes DRONE_ASSIGNED + RETURNING.
export const RETURNABLE_STATUSES: DeliveryStatus[] = [
  'PICKUP_IN_PROGRESS',
  'IN_TRANSIT',
  'AWAITING_HANDOFF',
];

export const DELIVERY_FAILURE_REASONS: DeliveryFailureReason[] = [
  'RECIPIENT_UNAVAILABLE',
  'WEATHER_ABORT',
  'UNSAFE_DROP_ZONE',
  'MECHANICAL',
  'ADMIN_ABORT',
  'OTHER',
];

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

export type ChipColor = 'default' | 'info' | 'success' | 'error' | 'warning';

const TONE_COLOR: Record<StatusTone, ChipColor> = {
  neutral: 'default',
  active: 'info',
  success: 'success',
  error: 'error',
  warning: 'warning',
};

export function deliveryStatusColor(status: DeliveryStatus): ChipColor {
  return TONE_COLOR[deliveryStatusTone(status)];
}

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
