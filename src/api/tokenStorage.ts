// Access token persistence. Kept in localStorage so a refresh survives; the backend's
// refresh-token rotation isn't wired into the console yet (a 401 just bounces to /login).
const KEY = 'drovery_admin_token';

export const getToken = (): string | null => localStorage.getItem(KEY);
export const setToken = (token: string): void => localStorage.setItem(KEY, token);
export const clearToken = (): void => localStorage.removeItem(KEY);
