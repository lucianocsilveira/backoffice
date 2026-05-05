import { PaginationMeta } from '../../games/models/game-item.model';

export interface ProfileListItem {
  id: string;
  nickname: string;
  displayName: string;
  avatarImageUrl: string;
  cardImageUrl: string;
  themeColor: string;
  priority: number;
}

export interface ProfileSectionContent {
  slug: string;
  gameImageUrl: string;
  priority: number;
}

export interface ProfileSection {
  id: string;
  icon: string;
  title: string;
  priority: number;
  message: string;
  content: ProfileSectionContent[];
}

export interface Profile {
  id: string;
  nickname: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  cardUrl: string;
  bannerUrl: string;
  themeColor: string;
  city: string;
  state: string;
  country: string;
  priority: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  sections: ProfileSection[];
}

export interface ProfileListResponse {
  items: ProfileListItem[];
  pagination: PaginationMeta;
}

export interface ProfileListParams {
  search?: string;
  page?: number;
  perPage?: number;
}

/** Used inside the form to represent a selected section with ordering */
export interface ProfileSelectedSection {
  sectionId: string;
  icon: string;
  title: string;
  priority: number;
}
