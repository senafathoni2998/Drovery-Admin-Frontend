import type {
  AdminDelivery,
  AdminRefundResponse,
  DroneCommandResponse,
} from '../models/admin';
import type { DeliveryFailureReason, DroneCommandType } from '../models/enums';
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
};
