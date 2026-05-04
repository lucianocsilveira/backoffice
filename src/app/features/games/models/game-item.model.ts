export interface GameItem {
  id: string;
  slug: string;
  imageUrl: string;
}

export interface GameItemRequest {
  slug: string;
}

export interface PaginationMeta {
  currentPage: number;
  from: number;
  to: number;
  total: number;
  lastPage: number;
}

export interface GameItemListResponse {
  items: GameItem[];
  pagination: PaginationMeta;
}

export interface GameListParams {
  search?: string;
  page?: number;
  perPage?: number;
}
