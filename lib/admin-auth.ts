/**
 * Admin Authentication Utility
 *
 * Provides centralized admin authentication for admin-only API routes.
 * Requires BOTH API token AND user identifier for two-factor security.
 * Follows the project's modular architecture pattern.
 */

/**
 * Get admin UUIDs (hardcoded for security)
 * @returns Array of admin UUIDs
 */
export function getAdminUuids(): string[] {
  // Hardcoded admin UUIDs - add more UUIDs to this array as needed
  return [
    "bd9d2b22-1b5b-43d3-b559-c53cbf1b7891", // Your Talent UUID
    // Add more admin UUIDs here as needed
  ];
}

/**
 * Get admin API token from environment variables
 * @returns Admin API token
 * @throws Error if ADMIN_API_TOKEN is not configured
 */
export function getAdminApiToken(): string {
  const adminApiToken = process.env.ADMIN_API_TOKEN;

  if (!adminApiToken) {
    throw new Error("ADMIN_API_TOKEN environment variable is not configured");
  }

  return adminApiToken;
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
 * Validate admin API token
 * @param token - The API token to validate
 * @returns True if token is valid admin API token
 */
export function validateAdminApiToken(token: string): boolean {
  try {
    const adminApiToken = getAdminApiToken();
    return token === adminApiToken;
  } catch (error) {
    console.error("Error validating admin API token:", error);
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

/**
 * Validate admin API token and return appropriate error response
 * @param token - The API token to validate
 * @returns NextResponse with error if invalid, null if valid
 */
export function validateAdminApiTokenWithResponse(token: string) {
  if (!validateAdminApiToken(token)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized - Invalid admin API token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return null; // Token is valid
}

/**
 * Validate admin authentication requiring BOTH API token AND user identifier
 * @param request - The incoming request
 * @returns NextResponse with error if invalid, null if valid
 */
export async function validateAdminAuth(request: Request) {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized - Missing Bearer token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();

  // First, validate the API token
  const apiTokenError = validateAdminApiTokenWithResponse(token);
  if (apiTokenError) {
    return apiTokenError;
  }

  // API token is valid, now check for user identifier in headers
  const userIdentifier =
    request.headers.get("x-user-id") || request.headers.get("X-User-Id");

  if (!userIdentifier) {
    return new Response(
      JSON.stringify({ error: "Unauthorized - Missing user identifier" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Validate that the user identifier is in the admin list
  if (!validateAdminToken(userIdentifier)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized - User not in admin list" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return null; // Both API token and user identifier are valid
}
