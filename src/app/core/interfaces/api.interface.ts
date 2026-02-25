import { Observable } from 'rxjs';

/**
 * API 응답 표준 형식
 */
export interface ApiResponse<T = any> {
  code: number;
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

/**
 * API 요청 옵션
 */
export interface ApiRequestOptions {
  showLoading?: boolean;
  showSuccessMessage?: boolean | string;
  showErrorMessage?: boolean | string;
  skipErrorHandling?: boolean;
  headers?: Record<string, string>;
}

/**
 * API 호출 핸들러 타입
 */
export type SuccessHandler<T> = (data: T, response: ApiResponse<T>) => void;
export type ErrorHandler = (error: any) => void;
export type LoadingHandler = (loading: boolean) => void;

