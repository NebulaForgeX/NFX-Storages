// API 响应类型定义

export interface BaseResponse {
  status?: number;
  code?: number;
  message?: string;
  error?: string;
}

export interface DataResponse<T> extends BaseResponse {
  data: T;
  meta?: Record<string, unknown>; // 用于存储额外的元数据，如 total 等
}

export interface ListDTO<T> {
  items: T[];
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

