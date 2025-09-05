import { createClient, Errors } from "@farcaster/quick-auth";

const client = createClient();

export interface FarcasterAuthResult {
  fid: number;
  isValid: boolean;
  error?: string;
}

/**
 * Validate Farcaster Quick Auth JWT token
 * @param token - JWT token from Authorization header
 * @param domain - Domain for token validation (from environment)
 * @returns Authentication result with FID
 */
export async function validateFarcasterAuth(
  token: string,
  domain: string,
): Promise<FarcasterAuthResult> {
  try {
    const payload = await client.verifyJwt({
      token,
      domain,
    });

    return {
      fid: payload.sub,
      isValid: true,
    };
  } catch (error) {
    if (error instanceof Errors.InvalidTokenError) {
      return {
        fid: 0,
        isValid: false,
        error: "Invalid Farcaster token",
      };
    }

    return {
      fid: 0,
      isValid: false,
      error: "Token validation failed",
    };
  }
}
