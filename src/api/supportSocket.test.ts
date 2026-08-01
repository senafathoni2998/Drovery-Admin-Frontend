import { describe, expect, it, vi } from 'vitest';

import type { SupportChatMessage } from '../models/admin';
import { openSupportSocket } from './supportSocket';
import { deriveWsBaseUrl } from './wsUrl';

describe('deriveWsBaseUrl', () => {
  it('swaps http→ws / https→wss and keeps host:port, dropping the path', () => {
    expect(deriveWsBaseUrl('http://localhost:3000/api/v1')).toBe(
      'ws://localhost:3000',
    );
    expect(deriveWsBaseUrl('https://api.drovery.app/api/v1')).toBe(
      'wss://api.drovery.app',
    );
  });
  it('throws on a malformed base', () => {
    expect(() => deriveWsBaseUrl('not-a-url')).toThrow();
  });
});

// Minimal fake WebSocket capturing handlers + sent frames, with helpers to drive events.
class FakeWS {
  static OPEN = 1;
  static instances: FakeWS[] = [];
  url: string;
  readyState = 1;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((ev: { code: number }) => void) | null = null;
  constructor(url: string) {
    this.url = url;
    FakeWS.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
  }
  // test drivers
  open() {
    this.onopen?.();
  }
  message(obj: unknown) {
    this.onmessage?.({ data: JSON.stringify(obj) });
  }
}

const msg = (over: Partial<SupportChatMessage> = {}): SupportChatMessage => ({
  id: 'm1',
  ticketId: 't1',
  senderRole: 'USER',
  senderUserId: 'u1',
  content: 'hello',
  createdAt: '2026-06-20T10:00:00.000Z',
  ...over,
});

function open(handlers: {
  onSubscribed?: () => void;
  onMessage?: (m: SupportChatMessage) => void;
  onUnavailable?: (r: string) => void;
}) {
  FakeWS.instances.length = 0;
  const conn = openSupportSocket({
    ticketId: 't1',
    getToken: () => 'tok',
    wsBaseUrl: 'ws://localhost:3000',
    WebSocketImpl: FakeWS as unknown as typeof WebSocket,
    callbacks: {
      onSubscribed: handlers.onSubscribed ?? (() => {}),
      onMessage: handlers.onMessage ?? (() => {}),
      onUnavailable: handlers.onUnavailable ?? (() => {}),
    },
  });
  return { conn, getWs: () => FakeWS.instances[FakeWS.instances.length - 1] };
}

describe('openSupportSocket frame handling', () => {
  it('sends a subscribe frame on open and reports onSubscribed on the ack', async () => {
    const onSubscribed = vi.fn();
    const { getWs } = open({ onSubscribed });
    await Promise.resolve(); // let the async connect() run
    const ws = getWs();
    ws.open();
    expect(JSON.parse(ws.sent[0])).toEqual({
      event: 'subscribe',
      data: { ticketId: 't1' },
    });
    ws.message({ event: 'subscribed', data: { ticketId: 't1' } });
    expect(onSubscribed).toHaveBeenCalledOnce();
  });

  it("delivers the gateway's 'message:new' broadcast as a message", async () => {
    // This is the frame the server actually sends: SupportChatPublisher publishes
    // { event: 'message:new', data } and the gateway forwards that envelope
    // verbatim. The client handled only 'subscribed' | 'error' | 'message:sent',
    // so every inbound customer message was dropped while the chip read "Live" —
    // and this test asserted a BARE payload the gateway never emits, so it passed
    // against dead code.
    const onMessage = vi.fn();
    const { getWs } = open({ onMessage });
    await Promise.resolve();
    getWs().message({
      event: 'message:new',
      data: msg({ id: 'abc', content: 'live!' }),
    });
    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'abc', content: 'live!' }),
    );
  });

  it("still delivers the sender's own 'message:sent' ack", async () => {
    // A sender receives both frames for their own message; the caller dedupes by id.
    const onMessage = vi.fn();
    const { getWs } = open({ onMessage });
    await Promise.resolve();
    getWs().message({
      event: 'message:sent',
      data: msg({ id: 'own-1', content: 'mine' }),
    });
    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'own-1' }),
    );
  });

  it('ignores a broadcast for a different ticket', async () => {
    const onMessage = vi.fn();
    const { getWs } = open({ onMessage });
    await Promise.resolve();
    getWs().message({ event: 'message:new', data: msg({ ticketId: 'OTHER' }) });
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('ignores an unwrapped payload — the gateway never sends one', async () => {
    const onMessage = vi.fn();
    const { getWs } = open({ onMessage });
    await Promise.resolve();
    getWs().message(msg({ id: 'bare', content: 'nope' }));
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('reports unavailable on a server error frame', async () => {
    const onUnavailable = vi.fn();
    const { getWs } = open({ onUnavailable });
    await Promise.resolve();
    getWs().message({ event: 'error', data: { message: 'no access' } });
    expect(onUnavailable).toHaveBeenCalledWith('subscribe-error');
  });
});
