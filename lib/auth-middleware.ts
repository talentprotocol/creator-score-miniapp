import { NextRequest, NextResponse } from "next/server";
import { detectClient } from "./utils";
import { validateFarcasterAuth } from "./farcaster-auth";
import { validatePrivyAuth } from "./privy-auth";
import { resolveTalentUser } from "./user-resolver";

export interface AuthResult {
  talentUuid: string;
  context: "farcaster" | "browser";
  isValid: boolean;
  error?: string;
}

/**
 * Context-aware authentication middleware
 * Validates authentication based on client context (Farcaster vs Browser)
 */
export async function validateUserAuth(
  request: NextRequest,
): Promise<AuthResult | NextResponse> {
  // Extract Authorization header
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid Authorization header" },
      { status: 401 },
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();

  // Detect client context
  const context = await detectClient();

  if (context === "farcaster") {
    return await validateFarcasterContext(token);
  } else {
    return await validateBrowserContext(token);
  }
}

/**
 * Validate authentication for Farcaster miniapp context
 */
async function validateFarcasterContext(
  token: string,
): Promise<AuthResult | NextResponse> {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000";
  const farcasterResult = await validateFarcasterAuth(token, domain);

  if (!farcasterResult.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: farcasterResult.error || "Invalid Farcaster authentication",
      },
      { status: 401 },
    );
  }

  // Convert FID to Talent UUID using existing resolver
  try {
    const user = await resolveTalentUser(farcasterResult.fid.toString());

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "User not found in Talent Protocol" },
        { status: 404 },
      );
    }

    return {
      talentUuid: user.id,
      context: "farcaster",
      isValid: true,
    };
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to resolve user identity" },
      { status: 500 },
    );
  }
}

/**
 * Validate authentication for browser context
 * Uses Privy token → wallet address → Talent UUID conversion
 */
async function validateBrowserContext(
  token: string,
): Promise<AuthResult | NextResponse> {
  const privyResult = await validatePrivyAuth(token);

  if (!privyResult.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: privyResult.error || "Invalid Privy authentication",
      },
      { status: 401 },
    );
  }

  return {
    talentUuid: privyResult.talentUuid!,
    context: "browser",
    isValid: true,
  };
}

/**
 * Validate that authenticated user owns the target Talent UUID
 */
export function validateOwnership(
  authenticatedUuid: string,
  targetUuid: string,
): boolean {
  return authenticatedUuid === targetUuid;
}
