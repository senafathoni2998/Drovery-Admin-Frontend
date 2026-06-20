import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
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
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';

import { adminApi } from '../../api/admin';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import type {
  AdminSupportTicketDetail,
  SupportChatMessage,
} from '../../models/admin';
import type { SupportTicketStatus } from '../../models/enums';
import {
  SUPPORT_TICKET_STATUSES,
  humanizeEnum,
  ticketStatusColor,
} from '../../models/enums';

function MessageBubble({
  m,
  customerName,
}: {
  m: SupportChatMessage;
  customerName: string;
}) {
  const fromCustomer = m.senderRole === 'USER';
  const label = fromCustomer
    ? customerName
    : m.senderRole === 'AGENT'
      ? 'Agent'
      : 'System';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: fromCustomer ? 'flex-start' : 'flex-end',
      }}
    >
      <Box
        sx={{
          maxWidth: '75%',
          bgcolor: fromCustomer ? 'grey.100' : 'primary.main',
          color: fromCustomer ? 'text.primary' : 'primary.contrastText',
          px: 2,
          py: 1,
          borderRadius: 2,
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
          {label} · {new Date(m.createdAt).toLocaleString()}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {m.content}
        </Typography>
      </Box>
    </Box>
  );
}

export default function SupportTicketDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: ticket, loading, error, refetch } =
    useApi<AdminSupportTicketDetail>(`/admin/support/tickets/${id}`);

  const [reply, setReply] = useState('');
  const replyM = useMutation(adminApi.replyToTicket);
  const statusM = useMutation(adminApi.setTicketStatus);

  if (!id) return <Navigate to="/support" replace />;

  if (loading && !ticket) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !ticket) {
    return (
      <Stack spacing={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/support')}
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

  if (!ticket) return null;

  const closed = ticket.status === 'CLOSED';

  const onStatusChange = async (next: SupportTicketStatus) => {
    if (next === ticket.status) return;
    if (await statusM.run(ticket.id, next)) refetch();
  };

  const onSend = async () => {
    const content = reply.trim();
    if (!content) return;
    if (await replyM.run(ticket.id, content)) {
      setReply('');
      refetch();
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/support')}
        >
          Back
        </Button>
        <Typography variant="h5">{ticket.user.name}</Typography>
        <Chip
          label={humanizeEnum(ticket.status)}
          color={ticketStatusColor(ticket.status)}
          size="small"
        />
        <Box sx={{ flexGrow: 1 }} />
        <FormControl size="small" sx={{ minWidth: 180 }} disabled={statusM.loading}>
          <InputLabel id="set-status">Set status</InputLabel>
          <Select<SupportTicketStatus>
            labelId="set-status"
            label="Set status"
            value={ticket.status}
            onChange={(e) =>
              void onStatusChange(e.target.value as SupportTicketStatus)
            }
          >
            {SUPPORT_TICKET_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {humanizeEnum(s)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {ticket.user.email} · opened {new Date(ticket.createdAt).toLocaleString()}
      </Typography>

      {statusM.error && <Alert severity="error">{statusM.error}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            {ticket.messages.length > 0 ? (
              ticket.messages.map((m) => (
                <MessageBubble key={m.id} m={m} customerName={ticket.user.name} />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No messages in this thread.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {closed ? (
            <Typography variant="body2" color="text.secondary">
              This ticket is closed. Set it to another status above to reply.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              <TextField
                label="Reply as agent"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                multiline
                minRows={2}
                fullWidth
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
              {replyM.error && <Alert severity="error">{replyM.error}</Alert>}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={onSend}
                  disabled={replyM.loading || reply.trim() === ''}
                >
                  {replyM.loading ? 'Sending…' : 'Send reply'}
                </Button>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
