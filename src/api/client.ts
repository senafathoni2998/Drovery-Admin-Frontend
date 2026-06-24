import { ApiError } from '../models/api';
import type { ApiEnvelope } from '../models/api';
import {
  clearToken,
  getRefreshToken,
  getToken,
  setTokens,
} from './tokenStorage';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

// Registered by the app so a 401 anywhere can drive a global logout/redirect without the
// client importing the Redux store (avoids a circular dependency).
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  let url = BASE_URL + path;
  if (query) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') qs.append(key, String(value));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }
  return url;
}

function extractMessage(json: unknown, status: number): string {
  if (json && typeof json === 'object' && 'message' in json) {
    const m = (json as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return `Request failed (${status})`;
}

// Single-flight refresh: a burst of concurrent 401s triggers exactly ONE /auth/refresh, and
// every caller awaits the same result. Resolves true when the rotated tokens were persisted.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    // No bearer — the refresh guard reads the token from the body (RefreshTokenDto).
    const res = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const text = await res.text();
    const json: unknown = text ? JSON.parse(text) : null;
    const data = (
      json as ApiEnvelope<{ accessToken: string; refreshToken: string }>
    )?.data;
    if (!data?.accessToken || !data?.refreshToken) return false;
    setTokens(data.accessToken, data.refreshToken); // rotation: store BOTH new tokens
    return true;
  } catch {
    return false;
  }
}

/**
 * Typed fetch against the backend. Adds the bearer token, sends/parses JSON, unwraps the
 * { success, data } success envelope, and throws an ApiError (with status + a readable
 * message) on any non-2xx.
 *
 * On a 401 it transparently refreshes the session ONCE (via the stored refresh token) and
 * retries the request; only if the refresh itself fails does it clear the session and fire the
 * global unauthorized handler. `retry` is internal — set on the post-refresh re-attempt so a
 * still-401 response can't loop.
 */
export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
  retry = false,
): Promise<T> {
  const { method = 'GET', body, query } = opts;
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // A 401 on an /auth/* route (login/refresh/logout) is terminal — don't try to refresh it.
    // Otherwise refresh once and retry; only a failed refresh ends the session.
    const isAuthRoute = path.startsWith('/auth/');
    if (!retry && !isAuthRoute && getRefreshToken()) {
      if (!refreshInFlight) {
        refreshInFlight = refreshSession().finally(() => {
          refreshInFlight = null;
        });
      }
      const refreshed = await refreshInFlight;
      if (refreshed) return apiFetch<T>(path, opts, true);
    }
    clearToken();
    unauthorizedHandler?.();
    throw new ApiError(401, 'Your session has expired — please sign in again.');
  }

  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(json, res.status));
  }

  return (json as ApiEnvelope<T>).data;
}
