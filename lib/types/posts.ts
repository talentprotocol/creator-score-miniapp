export interface Post {
  chain: string;
  name: string; // Title of the content
  platform: string; // Platform name (e.g., "paragraph")
  onchain_created_at: string; // ISO date string
  url: string; // Original post URL
  description: string;
  image_url: string;
  metadata: {
    symbol: string;
    post_id: string;
    block_number: number;
    transaction_hash: string;
  };
  onchain_address: string;
  owner_address: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    current_page: number;
    last_page: number;
  };
}
