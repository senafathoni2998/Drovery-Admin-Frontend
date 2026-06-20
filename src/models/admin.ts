// Admin API response types — mirror of src/admin/dto/admin-response.dto.ts in the backend.
// (The delivery row and support-message shapes are added in their feature increments, where
// the extended DeliveryResponseDto / SupportChatMessageDto are read in full.)
import type {
  DeliveryFailureReason,
  DroneCommandStatus,
  DroneCommandType,
  PromoDiscountType,
  Role,
  SupportTicketStatus,
} from './enums';

// GET /admin/overview
export interface AdminOverview {
  users: number;
  /** Delivery count per DeliveryStatus key (every status present, defaulting to 0). */
  deliveriesByStatus: Record<string, number>;
  /** Sum of all COMPLETED payment amounts (dollars). */
  revenue: number;
  openTickets: number;
  activeRecurringSchedules: number;
}

// POST /admin/deliveries/:id/refund
export interface AdminRefundResponse {
  deliveryId: string;
  refunded: number;
}

// POST/GET /admin/deliveries/:id/commands
export interface DroneCommandResponse {
  id: string;
  deliveryId: string;
  droneId: string;
  type: DroneCommandType;
  reason: DeliveryFailureReason;
  status: DroneCommandStatus;
  issuedByUserId: string | null;
  appliedTransition: boolean;
  resultNote: string | null;
  expiresAt: string;
  fetchedAt: string | null;
  ackedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET/POST/PATCH /admin/promos
export interface PromoResponse {
  id: string;
  code: string;
  description: string | null;
  discountType: PromoDiscountType;
  discountValue: number;
  minOrderTotal: number;
  maxDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  maxRedemptions: number | null;
  timesRedeemed: number;
  perUserLimit: number;
  createdAt: string;
  updatedAt: string;
}

// GET /admin/users
export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

// PATCH /admin/users/:id/role
export interface AdminUserRole {
  id: string;
  email: string;
  role: Role;
}

// Embedded user summary on admin support-ticket rows.
export interface AdminTicketUser {
  id: string;
  name: string;
  email: string;
}

// GET /admin/support/tickets
export interface AdminSupportTicketListItem {
  id: string;
  userId: string;
  message: string;
  status: SupportTicketStatus;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: AdminTicketUser;
}

// PATCH /admin/support/tickets/:id/status
export interface AdminSupportTicketStatusRow {
  id: string;
  userId: string;
  message: string;
  status: SupportTicketStatus;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}
