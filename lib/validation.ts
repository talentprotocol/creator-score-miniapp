import { CREATOR_CATEGORIES } from "./credentialUtils";

export const VALID_CREATOR_CATEGORIES = Object.keys(
  CREATOR_CATEGORIES,
) as Array<keyof typeof CREATOR_CATEGORIES>;

export function validateCreatorCategory(
  category: string,
): category is keyof typeof CREATOR_CATEGORIES {
  return VALID_CREATOR_CATEGORIES.includes(
    category as keyof typeof CREATOR_CATEGORIES,
  );
}

export function getCreatorCategoryErrorMessage(
  invalidCategory: string,
): string {
  return `Invalid category: '${invalidCategory}'. Must be one of: ${VALID_CREATOR_CATEGORIES.join(", ")}`;
}

export function validateTalentUUID(uuid: string): boolean {
  // Basic UUID v4 validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
