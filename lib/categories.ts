// Category mapping based on credential issuers
export const CREDENTIAL_CATEGORIES = {
  // Artist category
  "Zora": "Artist",
  "Base": "Artist", 
  "Phi": "Artist",
  
  // Reply Guy category
  "Farcaster": "Reply Guy",
  "Lens": "Reply Guy", 
  "Twitter": "Reply Guy",
  "X/Twitter": "Reply Guy",
  "Noice": "Reply Guy",
  
  // Writer category
  "Mirror": "Writer",
  "Paragraph": "Writer",
  
  // Music category
  "Coop Records": "Music",
  
  // Podcaster category
  "Pods": "Podcaster",
  
  // No category (these won't contribute to categorization)
  "Onchain activity": null,
  "EFP": null,
  "Stack": null,
  "ENS": null,
  "Flaunch": null,
} as const;

// All possible issuers that should be shown in the breakdown
export const ALL_ISSUERS = [
  "Zora",
  "Base", 
  "Phi",
  "Farcaster",
  "Lens", 
  "Twitter",
  "X/Twitter",
  "Noice",
  "Mirror",
  "Paragraph",
  "Coop Records",
  "Pods",
  "Flaunch",
] as const;

export type Category = "Artist" | "Reply Guy" | "Writer" | "Music" | "Podcaster";

export interface CategoryBreakdown {
  category: Category;
  points: number;
  percentage: number;
  credentials: Array<{
    issuer: string;
    label: string;
    points: number;
  }>;
}

export interface CreatorCategory {
  primaryCategory: Category | null;
  breakdown: CategoryBreakdown[];
  issuerBreakdown: Array<{
    issuer: string;
    category: Category | null;
    points: number;
    percentage: number;
    credentials: Array<{
      issuer: string;
      label: string;
      points: number;
    }>;
  }>;
  totalPoints: number;
}

/**
 * Determines the primary category for a creator based on their credentials
 */
export function determineCreatorCategory(
  issuerGroups: Array<{
    issuer: string;
    total: number;
    points: Array<{
      label: string;
      value: number;
    }>;
  }>
): CreatorCategory {
  const categoryPoints = new Map<Category, number>();
  const categoryCredentials = new Map<Category, Array<{
    issuer: string;
    label: string;
    points: number;
  }>>();

  let totalPoints = 0;

  // Calculate points per category
  issuerGroups.forEach(group => {
    const category = CREDENTIAL_CATEGORIES[group.issuer as keyof typeof CREDENTIAL_CATEGORIES];
    
    if (category) {
      const currentPoints = categoryPoints.get(category) || 0;
      categoryPoints.set(category, currentPoints + group.total);
      
      const currentCredentials = categoryCredentials.get(category) || [];
      const newCredentials = group.points.map(point => ({
        issuer: group.issuer,
        label: point.label,
        points: point.value,
      }));
      categoryCredentials.set(category, [...currentCredentials, ...newCredentials]);
    }
    
    totalPoints += group.total;
  });

  // Find primary category (highest points)
  let primaryCategory: Category | null = null;
  let maxPoints = 0;

  categoryPoints.forEach((points, category) => {
    if (points > maxPoints) {
      maxPoints = points;
      primaryCategory = category;
    }
  });

  // Create breakdown with all categories (including 0 points)
  const allCategories: Category[] = ["Artist", "Reply Guy", "Writer", "Music", "Podcaster"];
  const categoryBreakdown: CategoryBreakdown[] = allCategories.map(category => {
    const points = categoryPoints.get(category) || 0;
    const credentials = categoryCredentials.get(category) || [];
    
    return {
      category,
      points,
      percentage: totalPoints > 0 ? (points / totalPoints) * 100 : 0,
      credentials,
    };
  }).sort((a, b) => b.points - a.points);

  // Create issuer breakdown for the modal
  const issuerBreakdown: Array<{
    issuer: string;
    category: Category | null;
    points: number;
    percentage: number;
    credentials: Array<{
      issuer: string;
      label: string;
      points: number;
    }>;
  }> = ALL_ISSUERS.map(issuer => {
    const category = CREDENTIAL_CATEGORIES[issuer as keyof typeof CREDENTIAL_CATEGORIES];
    const issuerPoints = issuerGroups.find(g => g.issuer === issuer)?.total || 0;
    const issuerCredentials = issuerGroups.find(g => g.issuer === issuer)?.points.map(point => ({
      issuer,
      label: point.label,
      points: point.value,
    })) || [];
    
    return {
      issuer,
      category,
      points: issuerPoints,
      percentage: totalPoints > 0 ? (issuerPoints / totalPoints) * 100 : 0,
      credentials: issuerCredentials,
    };
  }).sort((a, b) => b.points - a.points);

  return {
    primaryCategory,
    breakdown: categoryBreakdown,
    issuerBreakdown,
    totalPoints,
  };
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: Category): string {
  switch (category) {
    case "Artist":
      return "bg-gradient-to-r from-purple-500 to-pink-500";
    case "Reply Guy":
      return "bg-gradient-to-r from-blue-500 to-cyan-500";
    case "Writer":
      return "bg-gradient-to-r from-emerald-500 to-teal-500";
    case "Music":
      return "bg-gradient-to-r from-rose-500 to-purple-600";
    case "Podcaster":
      return "bg-gradient-to-r from-orange-500 to-red-500";
    default:
      return "bg-gradient-to-r from-gray-500 to-gray-600";
  }
}

/**
 * Get category color for SVG (without bg- prefix)
 */
export function getCategorySvgColor(category: Category): string {
  switch (category) {
    case "Artist":
      return "#a855f7"; // vibrant purple
    case "Reply Guy":
      return "#06b6d4"; // vibrant cyan
    case "Writer":
      return "#10b981"; // vibrant emerald
    case "Music":
      return "#f43f5e"; // vibrant rose
    case "Podcaster":
      return "#f97316"; // vibrant orange
    default:
      return "#6b7280"; // gray-500
  }
}

/**
 * Get category background color for cards
 */
export function getCategoryBgColor(category: Category): string {
  switch (category) {
    case "Artist":
      return "bg-purple-50 border-purple-200";
    case "Reply Guy":
      return "bg-cyan-50 border-cyan-200";
    case "Writer":
      return "bg-emerald-50 border-emerald-200";
    case "Music":
      return "bg-rose-50 border-rose-200";
    case "Podcaster":
      return "bg-orange-50 border-orange-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

/**
 * Get category pastel color for progress bars
 */
export function getCategoryPastelColor(category: Category): string {
  switch (category) {
    case "Artist":
      return "#f3e8ff"; // purple-100
    case "Reply Guy":
      return "#cffafe"; // cyan-100
    case "Writer":
      return "#d1fae5"; // emerald-100
    case "Music":
      return "#ffe4e6"; // rose-100
    case "Podcaster":
      return "#fed7aa"; // orange-100
    default:
      return "#f3f4f6"; // gray-100
  }
}

/**
 * Get category pastel progress color for progress bars
 */
export function getCategoryPastelProgressColor(category: Category): string {
  switch (category) {
    case "Artist":
      return "#c084fc"; // purple-400
    case "Reply Guy":
      return "#22d3ee"; // cyan-400
    case "Writer":
      return "#34d399"; // emerald-400
    case "Music":
      return "#fb7185"; // rose-400
    case "Podcaster":
      return "#fb923c"; // orange-400
    default:
      return "#9ca3af"; // gray-400
  }
}

/**
 * Get category icon for UI
 */
export function getCategoryIcon(category: Category): string {
  switch (category) {
    case "Artist":
      return "🎨";
    case "Reply Guy":
      return "💬";
    case "Writer":
      return "✍️";
    case "Music":
      return "🎵";
    case "Podcaster":
      return "🎙️";
    default:
      return "👤";
  }
} 