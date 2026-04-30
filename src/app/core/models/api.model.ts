export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiPagination {
  currentPage: number;
  from: number;
  to: number;
  total: number;
  lastPage: number;
}

export interface ApiPagedResponse<T> {
  items: T[];
  pagination: ApiPagination;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}
