/**
 * Admin Authentication Utility
 *
 * Provides centralized admin UUID validation for admin-only API routes.
 * Follows the project's modular architecture pattern.
 */

/**
 * Get admin UUIDs from environment variables
 * @returns Array of admin UUIDs
 * @throws Error if ADMIN_UUIDS is not configured
 */
export function getAdminUuids(): string[] {
  const adminUuids = process.env.ADMIN_UUIDS;

  if (!adminUuids) {
    throw new Error("ADMIN_UUIDS environment variable is not configured");
  }

  // Split by comma to support multiple admin UUIDs
  return adminUuids
    .split(",")
    .map((uuid) => uuid.trim())
    .filter(Boolean);
}

/**
 * Validate if a token matches any admin UUID
 * @param token - The token to validate
 * @returns True if token is valid admin UUID
 */
export function validateAdminToken(token: string): boolean {
  try {
    const adminUuids = getAdminUuids();
    return adminUuids.includes(token);
  } catch (error) {
    console.error("Error validating admin token:", error);
    return false;
  }
}

/**
 * Validate admin token and return appropriate error response
 * @param token - The token to validate
 * @returns NextResponse with error if invalid, null if valid
 */
export function validateAdminTokenWithResponse(token: string) {
  if (!validateAdminToken(token)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized - Invalid admin token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return null; // Token is valid
}
