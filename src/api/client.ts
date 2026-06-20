import { ApiError } from '../models/api';
import type { ApiEnvelope } from '../models/api';
import { clearToken, getToken } from './tokenStorage';

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

/**
 * Typed fetch against the backend. Adds the bearer token, sends/parses JSON, unwraps the
 * { success, data } success envelope, and throws an ApiError (with status + a readable
 * message) on any non-2xx. A 401 clears the token and fires the global unauthorized handler.
 */
export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
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
