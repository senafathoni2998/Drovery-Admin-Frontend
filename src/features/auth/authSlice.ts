import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { apiFetch } from '../../api/client';
import { clearToken, getToken, setToken } from '../../api/tokenStorage';
import { ApiError } from '../../models/api';
import type { CurrentUser, LoginResponse } from '../../models/auth';

export type AuthStatus =
  | 'loading' // bootstrapping an existing token
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  user: CurrentUser | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  // If a token is already stored, we bootstrap the session (loadCurrentUser) → 'loading'.
  status: getToken() ? 'loading' : 'unauthenticated',
  error: null,
};

const toMessage = (e: unknown, fallback: string): string =>
  e instanceof ApiError ? e.message : fallback;

// POST /auth/login, persist the token, then resolve the full profile (incl. role) via /users/me.
export const login = createAsyncThunk<
  CurrentUser,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const res = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: creds,
    });
    setToken(res.accessToken);
    return await apiFetch<CurrentUser>('/users/me');
  } catch (e) {
    clearToken();
    return rejectWithValue(toMessage(e, 'Login failed'));
  }
});

// Bootstrap on app load when a token is present.
export const loadCurrentUser = createAsyncThunk<
  CurrentUser,
  void,
  { rejectValue: string }
>('auth/loadCurrentUser', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<CurrentUser>('/users/me');
  } catch (e) {
    return rejectWithValue(toMessage(e, 'Failed to restore session'));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearToken();
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload ?? 'Login failed';
      })
      .addCase(loadCurrentUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
