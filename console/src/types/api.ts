export type ApiErrorHandlerCallback = () => void | Promise<void>;

export interface IApiErrorHandler {
  handle401(): Promise<void>;
  handle403(): Promise<void>;
  handleServerError(): Promise<void>;
  handleByStatus(status: number): Promise<void>;
}

export interface ApiRequestConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  code?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}
