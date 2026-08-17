export interface Session {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export interface ApiError {
  message?: string;
  data?: ApiErrorResponse;
  error?: unknown;
}