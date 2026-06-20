import type { SupportChatMessage } from '../models/admin';
import { getToken } from './tokenStorage';
import { deriveWsBaseUrl } from './wsUrl';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export type UnavailableReason =
  | 'no-websocket' // no WebSocket impl (e.g. jsdom/node) — live mode unavailable
  | 'no-token' // not authenticated
  | 'connect-error' // open() threw or URL derivation failed
  | 'subscribe-error' // server rejected subscribe (no access / not found) or ack timed out
  | 'auth-failed' // closed 1008
  | 'drop-exhausted'; // transient drops exhausted the reconnect budget

export interface SupportSocketCallbacks {
  /** Server acked the subscribe — live messages will now stream in. */
  onSubscribed: () => void;
  /** A new message in THIS ticket's thread (the agent's own replies echo back too). */
  onMessage: (m: SupportChatMessage) => void;
  /** The socket can't serve this ticket — caller should stay on the REST-loaded thread. */
  onUnavailable: (reason: UnavailableReason) => void;
}

interface BackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitterMs: number;
  maxAttempts: number;
  subscribeTimeoutMs: number;
}

const DEFAULT_BACKOFF: BackoffConfig = {
  baseDelayMs: 1000,
  maxDelayMs: 15000,
  factor: 2,
  jitterMs: 250,
  maxAttempts: 5,
  subscribeTimeoutMs: 8000,
};

export interface SupportConnection {
  /** Idempotent teardown: detaches handlers, closes the socket, clears timers. */
  close: () => void;
}

interface OpenSupportOptions {
  ticketId: string;
  callbacks: SupportSocketCallbacks;
  getToken?: () => string | null | Promise<string | null>;
  wsBaseUrl?: string;
  WebSocketImpl?: typeof WebSocket;
  backoff?: Partial<BackoffConfig>;
}

/**
 * Open a live support-chat connection for ONE ticket. The handle is disposable (one handle =
 * one attempt-chain); teardown is always `close()`. Fail-safe: with no WebSocket impl, no
 * token, or a derivation error it fires onUnavailable so the caller keeps the REST thread.
 *
 * Frame protocol (native `ws` gateway): the client sends {event:'subscribe',data:{ticketId}}
 * and receives {event:'subscribed'|'error',...} ACKs — but BROADCAST messages arrive as a
 * BARE payload ({id,ticketId,senderRole,senderUserId,content,createdAt}) with NO event field.
 */
export function openSupportSocket(opts: OpenSupportOptions): SupportConnection {
  const { ticketId, callbacks } = opts;
  const readToken = opts.getToken ?? getToken;
  const backoff = { ...DEFAULT_BACKOFF, ...opts.backoff };

  const Impl =
    opts.WebSocketImpl ??
    (globalThis as { WebSocket?: typeof WebSocket }).WebSocket;
  if (!Impl) {
    queueMicrotask(() => callbacks.onUnavailable('no-websocket'));
    return { close: () => {} };
  }

  let wsBaseUrl: string;
  try {
    wsBaseUrl = opts.wsBaseUrl ?? deriveWsBaseUrl(API_BASE_URL);
  } catch {
    queueMicrotask(() => callbacks.onUnavailable('connect-error'));
    return { close: () => {} };
  }

  let ws: WebSocket | null = null;
  let attempt = 0;
  let closedFlag = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let subscribeTimer: ReturnType<typeof setTimeout> | null = null;

  const clearReconnect = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };
  const clearSubscribe = () => {
    if (subscribeTimer) clearTimeout(subscribeTimer);
    subscribeTimer = null;
  };
  const detach = () => {
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
    }
  };

  // Permanently stop this handle (server rejection / ack timeout): report unavailable, then
  // tear down so a later onclose can't reconnect-loop back to a rejecting endpoint.
  const failHandle = (reason: UnavailableReason) => {
    clearSubscribe();
    closedFlag = true;
    detach();
    try {
      ws?.close();
    } catch {
      /* noop */
    }
    callbacks.onUnavailable(reason);
  };

  const scheduleReconnect = () => {
    if (closedFlag) return;
    if (attempt >= backoff.maxAttempts) {
      callbacks.onUnavailable('drop-exhausted');
      return;
    }
    const delay =
      Math.min(backoff.baseDelayMs * backoff.factor ** attempt, backoff.maxDelayMs) +
      Math.floor(Math.random() * backoff.jitterMs);
    attempt += 1;
    reconnectTimer = setTimeout(() => void connect(), delay);
  };

  const onMessage = (ev: MessageEvent) => {
    let msg: unknown;
    try {
      msg = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data));
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object') return;
    const obj = msg as Record<string, unknown>;

    // ACK/response frames carry an `event`; broadcast messages do not.
    if ('event' in obj) {
      if (obj.event === 'subscribed') {
        clearSubscribe();
        attempt = 0;
        callbacks.onSubscribed();
      } else if (obj.event === 'error') {
        failHandle('subscribe-error');
      } else if (obj.event === 'message:sent') {
        const data = obj.data as SupportChatMessage | undefined;
        if (data && data.ticketId === ticketId) callbacks.onMessage(data);
      }
      return;
    }
    // Bare broadcast message payload.
    if (
      typeof obj.id === 'string' &&
      obj.ticketId === ticketId &&
      typeof obj.content === 'string'
    ) {
      callbacks.onMessage(obj as unknown as SupportChatMessage);
    }
  };

  const onOpen = () => {
    if (closedFlag || !ws) return;
    ws.send(JSON.stringify({ event: 'subscribe', data: { ticketId } }));
    subscribeTimer = setTimeout(
      () => failHandle('subscribe-error'),
      backoff.subscribeTimeoutMs,
    );
  };

  const onClose = (ev: CloseEvent) => {
    if (closedFlag) return;
    clearSubscribe();
    if (ev.code === 1008) {
      // Bad/expired token — don't reconnect; the REST layer handles 401 → re-login.
      closedFlag = true;
      callbacks.onUnavailable('auth-failed');
    } else {
      scheduleReconnect();
    }
  };

  const connect = async () => {
    if (closedFlag) return;
    let token: string | null = null;
    try {
      token = await Promise.resolve(readToken());
    } catch {
      token = null;
    }
    if (closedFlag) return;
    if (!token) {
      callbacks.onUnavailable('no-token');
      return;
    }
    try {
      ws = new Impl(
        `${wsBaseUrl}/ws/support?token=${encodeURIComponent(token)}`,
      );
    } catch {
      scheduleReconnect();
      return;
    }
    ws.onopen = onOpen;
    ws.onmessage = onMessage;
    ws.onerror = () => {
      /* log-only; the browser always follows with onclose */
    };
    ws.onclose = onClose;
  };

  const close = () => {
    closedFlag = true;
    clearReconnect();
    clearSubscribe();
    detach();
    if (ws) {
      try {
        ws.close(1000, 'client teardown');
      } catch {
        /* noop */
      }
      ws = null;
    }
  };

  void connect();
  return { close };
}
