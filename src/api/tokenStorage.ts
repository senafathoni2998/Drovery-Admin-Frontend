// Access + refresh token persistence (localStorage so a page reload survives a session). The
// console now wires the backend's refresh-token rotation: a 401 transparently refreshes via the
// stored refresh token (see api/client.ts), and only a FAILED refresh bounces to /login.
const KEY = 'drovery_admin_token';
const REFRESH_KEY = 'drovery_admin_refresh_token';

export const getToken = (): string | null => localStorage.getItem(KEY);
export const setToken = (token: string): void => localStorage.setItem(KEY, token);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_KEY);

/** Persist a freshly-issued access + (rotated) refresh token pair. */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
};

/** Clear the whole session (both tokens). */
export const clearToken = (): void => {
  localStorage.removeItem(KEY);
  localStorage.removeItem(REFRESH_KEY);
};
