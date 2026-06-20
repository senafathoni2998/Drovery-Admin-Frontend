// Backend response envelopes.
//
// Success responses are wrapped by the global TransformInterceptor as { success, data }.
// Error responses bypass it and are a flat { statusCode, message, ... } (message is a string
// or, for validation 400s, a string[]).

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
