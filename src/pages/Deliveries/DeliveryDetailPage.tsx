import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';

import ConfirmDialog from '../../components/ConfirmDialog';
import StatusChip from '../../components/StatusChip';
import { adminApi } from '../../api/admin';
import { deliveryActions } from '../../features/deliveries/deliveryActions';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import type { AdminDelivery, DroneCommandResponse } from '../../models/admin';
import type {
  DeliveryFailureReason,
  DroneCommandType,
} from '../../models/enums';
import { DELIVERY_FAILURE_REASONS, humanizeEnum } from '../../models/enums';

type DialogName = 'cancel' | 'fail' | 'refund' | 'command';

const fmt = (d: string | null | undefined): string =>
  d ? new Date(d).toLocaleString() : '—';

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default function DeliveryDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const {
    data: delivery,
    loading,
    error,
    refetch,
  } = useApi<AdminDelivery>(`/admin/deliveries/${id}`);
  const {
    data: commands,
    error: commandsError,
    refetch: refetchCommands,
  } = useApi<DroneCommandResponse[]>(`/admin/deliveries/${id}/commands`);

  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [failReason, setFailReason] =
    useState<DeliveryFailureReason>('ADMIN_ABORT');
  const [refundAmount, setRefundAmount] = useState('');
  const [cmdType, setCmdType] = useState<DroneCommandType>('RETURN_TO_BASE');
  const [cmdReason, setCmdReason] = useState<DeliveryFailureReason | ''>('');

  const cancelM = useMutation(adminApi.forceCancel);
  const failM = useMutation(adminApi.failDelivery);
  const refundM = useMutation(adminApi.refund);
  const cmdM = useMutation(adminApi.issueCommand);

  // Defensive: the :id route can't match without a segment, but never fetch a bare path.
  if (!id) return <Navigate to="/deliveries" replace />;

  if (loading && !delivery) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !delivery) {
    return (
      <Stack spacing={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/deliveries')}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back
        </Button>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Stack>
    );
  }

  if (!delivery) return null;

  const d = delivery;
  const actions = deliveryActions(d);

  const refresh = () => {
    refetch();
    refetchCommands();
    setDialog(null);
  };

  const openDialog = (name: DialogName) => {
    cancelM.reset();
    failM.reset();
    refundM.reset();
    cmdM.reset();
    if (name === 'refund') setRefundAmount(String(d.estimatedPrice));
    if (name === 'fail') setFailReason('ADMIN_ABORT');
    if (name === 'command') {
      // Default to the command that's actually LEGAL for this status (RETURN_TO_BASE is
      // illegal in DRONE_ASSIGNED/RETURNING) so confirming without touching the dropdown
      // can't send a guaranteed-409 request.
      setCmdType(actions.canReturnToBase ? 'RETURN_TO_BASE' : 'ABORT');
      setCmdReason('');
    }
    setDialog(name);
  };

  const onCancel = async () => {
    if (await cancelM.run(d.id)) refresh();
  };
  const onFail = async () => {
    if (await failM.run(d.id, failReason)) refresh();
  };
  const onRefund = async () => {
    const trimmed = refundAmount.trim();
    const amt = trimmed === '' ? undefined : Number(trimmed);
    if (await refundM.run(d.id, amt)) refresh();
  };
  const onCommand = async () => {
    const body = cmdReason
      ? { type: cmdType, reason: cmdReason }
      : { type: cmdType };
    if (await cmdM.run(d.id, body)) refresh();
  };

  const refundTrimmed = refundAmount.trim();
  const refundNum = Number(refundTrimmed);
  const refundInvalid =
    refundTrimmed !== '' &&
    (Number.isNaN(refundNum) || refundNum <= 0 || refundNum > d.estimatedPrice);

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/deliveries')}
        >
          Back
        </Button>
        <Typography variant="h4">{d.trackingId}</Typography>
        <StatusChip status={d.status} size="medium" />
        <Chip label={d.trackingSource} variant="outlined" size="small" />
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<RefreshIcon />} onClick={refetch} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {d.failureReason && (
        <Alert severity="error">
          Failed — reason: {humanizeEnum(d.failureReason)}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        <SectionCard title="Route">
          <Field label="From" value={d.fromAddress} />
          <Field label="To" value={d.toAddress} />
          <Field label="Receiver" value={d.receiver} />
        </SectionCard>

        <SectionCard title="Package">
          <Field label="Contents" value={d.packages} />
          <Field label="Size" value={d.packageSize} />
          <Field label="Weight" value={`${d.packageWeight} kg`} />
          <Field label="Types" value={d.packageTypes.join(', ') || '—'} />
        </SectionCard>

        <SectionCard title="Customer">
          {d.user ? (
            <>
              <Field label="Name" value={d.user.name} />
              <Field label="Email" value={d.user.email} />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              (no user relation)
            </Typography>
          )}
          <Field label="User ID" value={d.userId} />
        </SectionCard>

        <SectionCard title="Schedule & price">
          <Field label="Pickup" value={`${fmt(d.pickupDate)} · ${d.pickupTime}`} />
          <Field label="Scheduled for" value={fmt(d.scheduledFor)} />
          <Field label="Est. delivery" value={fmt(d.estimatedDelivery)} />
          <Field label="Price" value={`$${d.estimatedPrice.toFixed(2)}`} />
          <Field label="Created" value={fmt(d.createdAt)} />
          <Field label="Handoff confirmed" value={fmt(d.handoffConfirmedAt)} />
        </SectionCard>

        {d.payment && (
          <SectionCard title="Payment">
            <Field
              label="Amount"
              value={`$${d.payment.amount.toFixed(2)} ${d.payment.currency.toUpperCase()}`}
            />
            <Field
              label="Status"
              value={
                <Chip
                  label={humanizeEnum(d.payment.status)}
                  size="small"
                  color={d.payment.status === 'REFUNDED' ? 'warning' : 'default'}
                />
              }
            />
            <Field label="Intent" value={d.payment.stripePaymentIntentId ?? '—'} />
          </SectionCard>
        )}

        {(d.tracking || d.assignedDroneId) && (
          <SectionCard title="Live tracking">
            <Field label="Drone" value={d.assignedDroneId ?? '—'} />
            <Field label="Drone status" value={d.tracking?.droneStatus ?? '—'} />
            <Field
              label="Position"
              value={
                d.tracking?.droneLat != null && d.tracking?.droneLng != null
                  ? `${d.tracking.droneLat.toFixed(4)}, ${d.tracking.droneLng.toFixed(4)}`
                  : '—'
              }
            />
            <Field label="ETA" value={fmt(d.tracking?.eta)} />
          </SectionCard>
        )}

        {d.proofOfDelivery && (
          <SectionCard title="Proof of delivery">
            <Box
              component="img"
              src={d.proofOfDelivery.photoUrl}
              alt="Proof of delivery"
              sx={{
                width: '100%',
                maxHeight: 220,
                objectFit: 'cover',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'action.hover',
              }}
            />
            <Field
              label="Recipient"
              value={d.proofOfDelivery.recipientName ?? '—'}
            />
            <Field label="Captured" value={fmt(d.proofOfDelivery.capturedAt)} />
            <Field
              label="Location"
              value={
                d.proofOfDelivery.lat != null && d.proofOfDelivery.lng != null
                  ? `${d.proofOfDelivery.lat.toFixed(4)}, ${d.proofOfDelivery.lng.toFixed(4)}`
                  : '—'
              }
            />
            {d.proofOfDelivery.notes && (
              <Field label="Notes" value={d.proofOfDelivery.notes} />
            )}
          </SectionCard>
        )}

        {d.rating && (
          <SectionCard title="Customer rating">
            <Field
              label="Rating"
              value={`${'★'.repeat(d.rating.stars)}${'☆'.repeat(
                Math.max(0, 5 - d.rating.stars),
              )}  (${d.rating.stars}/5)`}
            />
            {d.rating.comment && (
              <Field label="Comment" value={d.rating.comment} />
            )}
            <Field label="Rated" value={fmt(d.rating.createdAt)} />
          </SectionCard>
        )}
      </Box>

      <SectionCard title="Operator actions">
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            color="error"
            disabled={!actions.canForceCancel}
            onClick={() => openDialog('cancel')}
          >
            Force cancel
          </Button>
          <Button
            variant="outlined"
            color="warning"
            disabled={!actions.canFail}
            onClick={() => openDialog('fail')}
          >
            Fail delivery
          </Button>
          <Button
            variant="outlined"
            disabled={!actions.canRefund}
            onClick={() => openDialog('refund')}
          >
            Refund
          </Button>
          <Button
            variant="outlined"
            disabled={!actions.canIssueCommand}
            onClick={() => openDialog('command')}
          >
            Issue drone command
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          Actions are gated by the delivery's status; the server makes the final call.
        </Typography>
      </SectionCard>

      <SectionCard title="Drone command history">
        {commandsError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refetchCommands}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            Couldn’t load command history: {commandsError}
          </Alert>
        )}
        {commands && commands.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Applied</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell>Acked</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commands.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{humanizeEnum(c.type)}</TableCell>
                  <TableCell>{humanizeEnum(c.status)}</TableCell>
                  <TableCell>{humanizeEnum(c.reason)}</TableCell>
                  <TableCell>{c.appliedTransition ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{fmt(c.createdAt)}</TableCell>
                  <TableCell>{fmt(c.ackedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !commandsError && (
            <Typography variant="body2" color="text.secondary">
              No commands issued.
            </Typography>
          )
        )}
      </SectionCard>

      {/* ── Action dialogs ── */}
      <ConfirmDialog
        open={dialog === 'cancel'}
        title="Force-cancel this delivery?"
        description="Cancels the delivery regardless of state (non-terminal only). This cannot be undone."
        confirmLabel="Force cancel"
        confirmColor="error"
        loading={cancelM.loading}
        error={cancelM.error}
        onConfirm={onCancel}
        onClose={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'fail'}
        title="Fail this delivery?"
        description="Marks it as a delivery exception. A drone-fault reason refunds the customer's wallet."
        confirmLabel="Fail delivery"
        confirmColor="warning"
        loading={failM.loading}
        error={failM.error}
        onConfirm={onFail}
        onClose={() => setDialog(null)}
      >
        <FormControl fullWidth size="small">
          <InputLabel id="fail-reason">Reason</InputLabel>
          <Select<DeliveryFailureReason>
            labelId="fail-reason"
            label="Reason"
            value={failReason}
            onChange={(e) => setFailReason(e.target.value as DeliveryFailureReason)}
          >
            {DELIVERY_FAILURE_REASONS.map((r) => (
              <MenuItem key={r} value={r}>
                {humanizeEnum(r)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'refund'}
        title="Refund to wallet?"
        description="Credits the customer's wallet (Stripe has no refund integration). Idempotent per delivery."
        confirmLabel="Refund"
        loading={refundM.loading}
        error={refundM.error}
        disabled={refundInvalid}
        onConfirm={onRefund}
        onClose={() => setDialog(null)}
      >
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Amount (USD)"
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
          error={refundInvalid}
          helperText={
            refundInvalid
              ? `Must be between 0 and the charged total ($${d.estimatedPrice.toFixed(2)})`
              : `Max $${d.estimatedPrice.toFixed(2)} — leave as-is for a full refund`
          }
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'command'}
        title="Issue drone command"
        description="Sends a command to the LIVE drone. The delivery transitions only when the drone acks."
        confirmLabel="Issue command"
        loading={cmdM.loading}
        error={cmdM.error}
        onConfirm={onCommand}
        onClose={() => setDialog(null)}
      >
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="cmd-type">Command</InputLabel>
            <Select<DroneCommandType>
              labelId="cmd-type"
              label="Command"
              value={cmdType}
              onChange={(e) => setCmdType(e.target.value as DroneCommandType)}
            >
              <MenuItem value="RETURN_TO_BASE" disabled={!actions.canReturnToBase}>
                Return to base
                {!actions.canReturnToBase && ' (not allowed in this status)'}
              </MenuItem>
              <MenuItem value="ABORT" disabled={!actions.canAbort}>
                Abort
              </MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel id="cmd-reason">Reason (optional)</InputLabel>
            <Select<DeliveryFailureReason | ''>
              labelId="cmd-reason"
              label="Reason (optional)"
              value={cmdReason}
              onChange={(e) =>
                setCmdReason(e.target.value as DeliveryFailureReason | '')
              }
            >
              <MenuItem value="">Default for command type</MenuItem>
              {DELIVERY_FAILURE_REASONS.map((r) => (
                <MenuItem key={r} value={r}>
                  {humanizeEnum(r)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </ConfirmDialog>
    </Stack>
  );
}
