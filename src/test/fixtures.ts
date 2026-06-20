// Sample API response objects for render tests. Each is a factory taking overrides.
import type {
  AdminDelivery,
  AdminOverview,
  AdminSupportTicketDetail,
  AdminSupportTicketListItem,
  AdminUserListItem,
  DroneCommandResponse,
  PromoResponse,
  SupportChatMessage,
} from '../models/admin';
import type { Paginated } from '../models/api';

const TS = '2026-06-20T10:00:00.000Z';

export function overview(over: Partial<AdminOverview> = {}): AdminOverview {
  return {
    users: 1234,
    deliveriesByStatus: { DELIVERED: 800, IN_TRANSIT: 12, DELIVERY_FAILED: 3 },
    revenue: 4567.89,
    openTickets: 5,
    activeRecurringSchedules: 7,
    ...over,
  };
}

export function delivery(over: Partial<AdminDelivery> = {}): AdminDelivery {
  return {
    id: 'd1',
    trackingId: 'DRV-0001',
    userId: 'u1',
    status: 'IN_TRANSIT',
    trackingSource: 'SIMULATED',
    assignedDroneId: null,
    failureReason: null,
    fromAddress: 'Jl. Asia Afrika, Bandung',
    toAddress: 'Jl. Braga, Bandung',
    fromLat: -6.92,
    fromLng: 107.6,
    toLat: -6.91,
    toLng: 107.61,
    receiver: 'Recipient',
    packages: '1 box',
    packageSize: 'Small',
    packageWeight: 1.5,
    packageTypes: ['document'],
    pickupDate: TS,
    pickupTime: '10:00 AM',
    scheduledFor: null,
    estimatedDelivery: null,
    estimatedPrice: 12,
    handoffConfirmedAt: null,
    createdAt: TS,
    updatedAt: TS,
    user: { id: 'u1', name: 'Budi Santoso', email: 'budi@example.com' },
    payment: {
      id: 'p1',
      deliveryId: 'd1',
      stripePaymentIntentId: 'pi_mock',
      amount: 12,
      currency: 'usd',
      status: 'COMPLETED',
      createdAt: TS,
    },
    tracking: null,
    proofOfDelivery: null,
    rating: null,
    ...over,
  };
}

export function droneCommand(
  over: Partial<DroneCommandResponse> = {},
): DroneCommandResponse {
  return {
    id: 'c1',
    deliveryId: 'd1',
    droneId: 'drone-9',
    type: 'RETURN_TO_BASE',
    reason: 'WEATHER_ABORT',
    status: 'ACKED',
    issuedByUserId: 'admin-1',
    appliedTransition: true,
    resultNote: null,
    expiresAt: TS,
    fetchedAt: TS,
    ackedAt: TS,
    createdAt: TS,
    updatedAt: TS,
    ...over,
  };
}

export function promo(over: Partial<PromoResponse> = {}): PromoResponse {
  return {
    id: 'pr1',
    code: 'WELCOME10',
    description: '10% off your first delivery',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderTotal: 0,
    maxDiscount: 5,
    startsAt: null,
    endsAt: null,
    active: true,
    maxRedemptions: 1000,
    timesRedeemed: 3,
    perUserLimit: 1,
    createdAt: TS,
    updatedAt: TS,
    ...over,
  };
}

export function userRow(over: Partial<AdminUserListItem> = {}): AdminUserListItem {
  return {
    id: 'u1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    role: 'USER',
    createdAt: TS,
    ...over,
  };
}

export function ticketListItem(
  over: Partial<AdminSupportTicketListItem> = {},
): AdminSupportTicketListItem {
  return {
    id: 't1',
    userId: 'u1',
    message: 'My drone never arrived',
    status: 'OPEN',
    lastMessageAt: TS,
    createdAt: TS,
    updatedAt: TS,
    user: { id: 'u1', name: 'Budi Santoso', email: 'budi@example.com' },
    ...over,
  };
}

export function chatMessage(
  over: Partial<SupportChatMessage> = {},
): SupportChatMessage {
  return {
    id: 'm1',
    ticketId: 't1',
    senderRole: 'USER',
    senderUserId: 'u1',
    content: 'My drone never arrived',
    createdAt: TS,
    ...over,
  };
}

export function ticketDetail(
  over: Partial<AdminSupportTicketDetail> = {},
): AdminSupportTicketDetail {
  return {
    id: 't1',
    userId: 'u1',
    message: 'My drone never arrived',
    status: 'OPEN',
    lastMessageAt: TS,
    createdAt: TS,
    updatedAt: TS,
    user: { id: 'u1', name: 'Budi Santoso', email: 'budi@example.com' },
    messages: [chatMessage()],
    ...over,
  };
}

/** Wrap items in the paginated envelope shape useApi expects. */
export function page<T>(items: T[]): Paginated<T> {
  return { items, total: items.length, page: 1, limit: 20 };
}
