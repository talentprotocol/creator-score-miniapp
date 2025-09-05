import * as jose from "jose";
import { getTalentUserService } from "@/app/services/userService";

export interface PrivyAuthResult {
  talentUuid: string | null;
  walletAddress: string | null;
  isValid: boolean;
  error?: string;
}

/**
 * Validate Privy access token and extract wallet address
 * Then convert wallet address to Talent UUID using existing service
 */
export async function validatePrivyAuth(
  token: string,
): Promise<PrivyAuthResult> {
  try {
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!privyAppId) {
      return {
        talentUuid: null,
        walletAddress: null,
        isValid: false,
        error: "Privy app ID not configured",
      };
    }

    // Get Privy's public key for JWT verification
    const jwksUrl = `https://auth.privy.io/api/v1/apps/${privyAppId}/jwks`;
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));

    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: "privy.io",
      audience: privyAppId,
    });

    // Extract wallet address from Privy token
    const walletAddress = extractWalletAddressFromPrivyPayload(payload);

    if (!walletAddress) {
      return {
        talentUuid: null,
        walletAddress: null,
        isValid: false,
        error: "No wallet address found in token",
      };
    }

    // Convert wallet address to Talent UUID using existing service
    const user = await getTalentUserService(walletAddress);

    if (!user?.id) {
      return {
        talentUuid: null,
        walletAddress,
        isValid: false,
        error: "Wallet address not found in Talent Protocol",
      };
    }

    return {
      talentUuid: user.id,
      walletAddress,
      isValid: true,
    };
  } catch (error) {
    // Handle specific JWT verification errors
    if (error instanceof jose.errors.JWTExpired) {
      return {
        talentUuid: null,
        walletAddress: null,
        isValid: false,
        error: "Privy token has expired",
      };
    }

    if (error instanceof jose.errors.JWTInvalid) {
      return {
        talentUuid: null,
        walletAddress: null,
        isValid: false,
        error: "Invalid Privy token format",
      };
    }

    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      return {
        talentUuid: null,
        walletAddress: null,
        isValid: false,
        error: "Privy token validation failed",
      };
    }

    // Handle network errors when fetching JWKS
    if (error instanceof Error && error.message.includes("fetch")) {
      return {
        talentUuid: null,
        walletAddress: null,
        isValid: false,
        error: "Failed to verify Privy token (network error)",
      };
    }

    // Generic fallback for other errors
    return {
      talentUuid: null,
      walletAddress: null,
      isValid: false,
      error: "Privy token verification failed",
    };
  }
}

/**
 * Extract wallet address from Privy JWT payload
 * Based on Privy documentation, wallet addresses are in the 'wallet' field
 */
function extractWalletAddressFromPrivyPayload(
  payload: Record<string, unknown>,
): string | null {
  // Privy stores wallet addresses in the 'wallet' field of the JWT payload
  // This is the primary wallet address connected to the user
  const wallet = payload.wallet as { address?: string } | string | undefined;
  return (typeof wallet === "object" ? wallet?.address : wallet) || null;
}
