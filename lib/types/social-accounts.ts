export interface SocialAccount {
  source: string;
  handle: string | null;
  followerCount: number | null;
  accountAge: string | null;
  profileUrl?: string | null;
  imageUrl?: string | null;
  displayName?: string | null; // For UI display (e.g., 'GitHub')
}

export interface TalentSocialAccount {
  source: string;
  handle: string | null;
  followers_count: number | null;
  owned_since: string | null;
  profile_url: string | null;
  image_url: string | null;
}
