// Search types
export interface SearchProfile {
  id: string;
  name: string;
  display_name?: string;
  image_url?: string;
  score?: number;
  accounts?: Array<{
    source: string;
    identifier: string;
    username?: string;
    followers_count?: number;
  }>;
}

export interface SearchResponse {
  profiles: SearchProfile[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export interface SearchResult {
  id: string;
  name: string;
  avatarUrl?: string;
  score: number;
}
