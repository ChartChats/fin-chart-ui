// Export types for API responses
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}