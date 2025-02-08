export interface PaginationResponse<T> {
  items: T;
  total: number;
  lastElement: boolean;
}
