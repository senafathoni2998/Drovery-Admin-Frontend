import type { AdminDelivery } from '../../models/admin';
import {
  FAILABLE_STATUSES,
  RETURNABLE_STATUSES,
  TERMINAL_STATUSES,
} from '../../models/enums';

export interface DeliveryActions {
  canForceCancel: boolean;
  canFail: boolean;
  /** RETURN_TO_BASE — legal only on the narrower RETURNABLE set. */
  canReturnToBase: boolean;
  /** ABORT — legal on any failable status. */
  canAbort: boolean;
  /** Whether ANY drone command is legal (drives the panel button). */
  canIssueCommand: boolean;
  canRefund: boolean;
}

/**
 * Which operator actions to ENABLE for a delivery, mirroring the backend CAS gating
 * (src/deliveries/delivery-exceptions.ts + commands/command.constants.ts). The server is
 * still authoritative — these only keep the UI from offering an action it would obviously
 * reject. Command legality is PER TYPE: ABORT is legal anywhere failable, but RETURN_TO_BASE
 * needs the narrower RETURNABLE set (excludes DRONE_ASSIGNED + RETURNING).
 */
export function deliveryActions(d: AdminDelivery): DeliveryActions {
  const failable = FAILABLE_STATUSES.includes(d.status);
  const returnable = RETURNABLE_STATUSES.includes(d.status);
  const liveDrone = d.trackingSource === 'LIVE' && !!d.assignedDroneId;
  const canReturnToBase = liveDrone && returnable;
  const canAbort = liveDrone && failable;
  return {
    canForceCancel: !TERMINAL_STATUSES.includes(d.status),
    canFail: failable,
    canReturnToBase,
    canAbort,
    canIssueCommand: canReturnToBase || canAbort,
    // The backend refund is a goodwill wallet credit allowed regardless of payment state;
    // the only hard guard is idempotency (a second refund 409s). Mirror that: block only an
    // already-REFUNDED payment, allow everything else (incl. no/FAILED payment).
    canRefund: d.payment?.status !== 'REFUNDED',
  };
}
