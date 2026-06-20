// Derive the WebSocket origin from the HTTP API base URL.
//
// The backend WS gateways attach to the SAME http server; the `/api/v1` global prefix is
// HTTP-only and does NOT apply to socket paths (backend main.ts: WsAdapter + setGlobalPrefix).
// The support gateway lives at ws(s)://<host:port>/ws/support. We keep host:port verbatim
// (never hardcode :3000 — prod TLS may terminate on 443) and only swap the scheme.
export function deriveWsBaseUrl(apiUrl: string): string {
  const m = apiUrl.match(/^(https?):\/\/([^/]+)/);
  if (!m) throw new Error(`Invalid API base URL: ${apiUrl}`);
  const scheme = m[1] === 'https' ? 'wss' : 'ws';
  return `${scheme}://${m[2]}`;
}
