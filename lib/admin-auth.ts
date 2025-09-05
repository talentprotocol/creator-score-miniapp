/**
 * Admin Authentication Utility
 *
 * Provides centralized admin authentication for admin-only API routes.
 * Supports both server-to-server (API token) and browser-based (Privy + UUID) authentication.
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
 * Validate admin authentication using either API token or UUID
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

  // First, try to validate as API token (server-to-server) - highest priority
  const apiTokenError = validateAdminApiTokenWithResponse(token);
  if (!apiTokenError) {
    // API token is valid, no need for additional validation
    return null;
  }

  // If API token fails, try UUID-based validation as fallback
  const uuidError = validateAdminTokenWithResponse(token);
  if (uuidError) {
    return uuidError;
  }

  return null; // Authentication successful
}
