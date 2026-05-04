import { PaginationMeta } from '../../games/models/game-item.model';

export interface SectionContentItem {
  slug: string;
  gameImageUrl: string;
  priority: number;
}

export interface Section {
  id: string;
  icon: string;
  title: string;
  priority?: number;
  message: string;
  content: SectionContentItem[];
}

export interface SectionListResponse {
  items: Section[];
  pagination: PaginationMeta;
}

export interface SectionListParams {
  search?: string;
  page?: number;
  perPage?: number;
}

export interface SectionFormItemPayload {
  gameItemId: string;
  priority: number;
}

export interface SectionRequest {
  icon: string;
  title: string;
  message: string;
  items: SectionFormItemPayload[] | null;
}

/** Used only inside the form component */
export interface SectionSelectedItem {
  gameItemId: string;
  slug: string;
  gameImageUrl: string;
  priority: number;
}
