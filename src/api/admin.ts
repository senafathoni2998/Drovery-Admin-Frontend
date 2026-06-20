import type {
  AdminDelivery,
  AdminRefundResponse,
  AdminUserRole,
  CreatePromoBody,
  DroneCommandResponse,
  PromoResponse,
  UpdatePromoBody,
} from '../models/admin';
import type {
  DeliveryFailureReason,
  DroneCommandType,
  Role,
} from '../models/enums';
import { apiFetch } from './client';

// Admin mutations (the operator actions). Read endpoints (list/detail/command-history) go
// through the useApi hook in the pages so they participate in loading/refetch there.
export const adminApi = {
  forceCancel: (id: string) =>
    apiFetch<AdminDelivery>(`/admin/deliveries/${id}/force-cancel`, {
      method: 'POST',
    }),

  failDelivery: (id: string, reason?: DeliveryFailureReason) =>
    apiFetch<AdminDelivery>(`/admin/deliveries/${id}/fail`, {
      method: 'POST',
      body: reason ? { reason } : {},
    }),

  refund: (id: string, amount?: number) =>
    apiFetch<AdminRefundResponse>(`/admin/deliveries/${id}/refund`, {
      method: 'POST',
      body: amount !== undefined ? { amount } : {},
    }),

  issueCommand: (
    id: string,
    body: { type: DroneCommandType; reason?: DeliveryFailureReason },
  ) =>
    apiFetch<DroneCommandResponse>(`/admin/deliveries/${id}/commands`, {
      method: 'POST',
      body,
    }),

  createPromo: (body: CreatePromoBody) =>
    apiFetch<PromoResponse>('/admin/promos', { method: 'POST', body }),

  updatePromo: (id: string, body: UpdatePromoBody) =>
    apiFetch<PromoResponse>(`/admin/promos/${id}`, { method: 'PATCH', body }),

  setRole: (id: string, role: Role) =>
    apiFetch<AdminUserRole>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: { role },
    }),
};
