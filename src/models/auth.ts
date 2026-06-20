import type { Role } from './enums';

// POST /auth/login → { user: {...}, accessToken, refreshToken } (inside the success envelope).
export interface LoginResponse {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken: string;
}

// GET /users/me → UserResponseDto (role added server-side for the console).
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  locale: string;
}
