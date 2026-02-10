// ---- Enums ----
export enum Role {
  ADMIN = 'admin',
  CTI_EDITOR = 'cti_editor',
  GROUP_MANAGER = 'group_manager',
  VIEWER = 'viewer',
}

export enum VisibilityScope {
  PUBLIC = 'public',
  GROUPS = 'groups',
}

export enum SourceType {
  RSS = 'rss',
  GENERIC_API = 'generic_api',
  GITHUB_RELEASES = 'github_releases',
  HTML_SCRAPE = 'html_scrape',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ItemCategory {
  VULNERABILITY = 'vulnerability',
  EXPLOIT = 'exploit',
  RANSOMWARE = 'ransomware',
  FRAUD = 'fraud',
  DATA_LEAK = 'data_leak',
  MALWARE = 'malware',
  PHISHING = 'phishing',
  SUPPLY_CHAIN = 'supply_chain',
  GENERAL = 'general',
}

// ---- DTOs ----
export interface UserDto {
  id: string;
  email: string;
  name: string;
  picture?: string;
  status: UserStatus;
  role: Role;
  groups: GroupDto[];
  createdAt: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description?: string;
}

export interface GroupPolicyDto {
  groupId: string;
  followedTags: string[];
  followedCategories: string[];
  keywordsInclude: string[];
  keywordsExclude: string[];
  dashboardJson?: Record<string, unknown>;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface SourceDto {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  scheduleCron: string;
  enabled: boolean;
  mappingConfigJson?: Record<string, unknown>;
  visibilityScope: VisibilityScope;
  visibilityGroupIds: string[];
  categories: CategoryDto[];
  createdAt: string;
}

export interface ItemDto {
  id: string;
  sourceId: string;
  source?: SourceDto;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  publishedAt?: string;
  collectedAt: string;
  categories: CategoryDto[];
  visibilityScope: VisibilityScope;
  visibilityGroupIds: string[];
  entities: ItemEntitiesDto;
  tags: string[];
}

export interface ItemEntitiesDto {
  cves: string[];
  cwes: string[];
  vendors: string[];
  products: string[];
}

export interface UserPreferencesDto {
  followedTags: string[];
  followedCategories: string[];
  keywordsInclude: string[];
  keywordsExclude: string[];
}

export interface FeedFilters {
  search?: string;
  categories?: string[];
  sourceIds?: string[];
  tags?: string[];
  cve?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  newSinceLastVisit?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogDto {
  id: string;
  actorUserId: string;
  actorEmail?: string;
  action: string;
  objectType: string;
  objectId?: string;
  timestamp: string;
  diffJson?: Record<string, unknown>;
}

export interface DashboardStats {
  totalItems: number;
  itemsToday: number;
  itemsThisWeek: number;
  byCategoryCount: Record<string, number>;
  topCves: string[];
  topTags: string[];
  recentItems: ItemDto[];
}
