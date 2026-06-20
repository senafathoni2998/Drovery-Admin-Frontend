// Admin API response types — mirror of src/admin/dto/admin-response.dto.ts in the backend.
// (The delivery row and support-message shapes are added in their feature increments, where
// the extended DeliveryResponseDto / SupportChatMessageDto are read in full.)
import type {
  DeliveryFailureReason,
  DeliveryStatus,
  DroneCommandStatus,
  DroneCommandType,
  PaymentStatus,
  PromoDiscountType,
  Role,
  SupportTicketStatus,
  TrackingSource,
} from './enums';

// ── Deliveries (admin oversight) — mirror of DeliveryResponseDto + the admin extras. ─────
// Dates arrive as ISO strings over JSON.

export interface AdminDeliveryUser {
  id: string;
  name: string;
  email: string;
}

export interface PaymentSummary {
  id: string;
  deliveryId: string;
  stripePaymentIntentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface DeliveryTracking {
  id: string;
  deliveryId: string;
  droneLat: number | null;
  droneLng: number | null;
  droneStatus: string | null;
  /** Encoded route geometry, when available (unused by the console today). */
  routeJson: Record<string, unknown> | null;
  eta: string | null;
  updatedAt: string;
}

export interface ProofOfDelivery {
  id: string;
  deliveryId: string;
  photoUrl: string;
  recipientName: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  capturedAt: string;
}

export interface DeliveryRating {
  id: string;
  deliveryId: string;
  userId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDelivery {
  id: string;
  trackingId: string;
  userId: string;
  status: DeliveryStatus;
  trackingSource: TrackingSource;
  assignedDroneId: string | null;
  failureReason: DeliveryFailureReason | null;
  fromAddress: string;
  toAddress: string;
  fromLat: number | null;
  fromLng: number | null;
  toLat: number | null;
  toLng: number | null;
  receiver: string;
  packages: string;
  packageSize: string;
  packageWeight: number;
  packageTypes: string[];
  pickupDate: string;
  pickupTime: string;
  scheduledFor: string | null;
  estimatedDelivery: string | null;
  estimatedPrice: number;
  handoffConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations: user + payment on list rows; + tracking/proof/rating on detail.
  user?: AdminDeliveryUser | null;
  payment?: PaymentSummary | null;
  tracking?: DeliveryTracking | null;
  proofOfDelivery?: ProofOfDelivery | null;
  rating?: DeliveryRating | null;
}

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

// POST /admin/promos (CreatePromoDto). code is uppercased server-side; dates are ISO strings.
export interface CreatePromoBody {
  code: string;
  description?: string;
  discountType: PromoDiscountType;
  discountValue: number;
  minOrderTotal?: number;
  maxDiscount?: number;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
}

// PATCH /admin/promos/:id (UpdatePromoDto) — code, discountType and startsAt are NOT editable.
export interface UpdatePromoBody {
  description?: string;
  discountValue?: number;
  minOrderTotal?: number;
  maxDiscount?: number;
  endsAt?: string;
  maxRedemptions?: number;
  active?: boolean;
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
