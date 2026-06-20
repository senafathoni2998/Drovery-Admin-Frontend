import { useEffect, useRef, useState } from 'react';

import { openSupportSocket } from '../../api/supportSocket';
import type { SupportChatMessage } from '../../models/admin';

export type SupportSocketStatus = 'connecting' | 'live' | 'offline';

/**
 * Subscribe to a ticket's live message stream. `onMessage` is held in a ref so the page can
 * pass an inline callback without re-opening the socket on every render — the socket only
 * re-handshakes when `ticketId` changes (or unmount), and `close()` detaches handlers so no
 * callback fires after teardown.
 */
export function useSupportSocket(
  ticketId: string,
  onMessage: (m: SupportChatMessage) => void,
): SupportSocketStatus {
  const [status, setStatus] = useState<SupportSocketStatus>('connecting');
  const cbRef = useRef(onMessage);
  // Keep the ref current WITHOUT writing during render (react-hooks/refs) — this runs after
  // each commit, so the socket (opened once per ticketId) always calls the latest callback.
  useEffect(() => {
    cbRef.current = onMessage;
  });

  useEffect(() => {
    if (!ticketId) return;
    // Reset to connecting for the new ticket — intentional synchronous setState.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setStatus('connecting');
    const conn = openSupportSocket({
      ticketId,
      callbacks: {
        onSubscribed: () => setStatus('live'),
        onMessage: (m) => cbRef.current(m),
        onUnavailable: () => setStatus('offline'),
      },
    });
    return () => conn.close();
  }, [ticketId]);

  return status;
}
