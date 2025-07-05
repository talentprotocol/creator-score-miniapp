import { NextResponse } from "next/server";

// Common API validation utilities
export function validateApiKey(
  apiKey: string | undefined,
  keyName: string = "API key",
): string | null {
  if (!apiKey) {
    return `${keyName} not configured`;
  }
  return null;
}

export function validateTalentApiKey(): string | null {
  return validateApiKey(process.env.TALENT_API_KEY, "Talent API key");
}

export function validateNeynarApiKey(): string | null {
  return validateApiKey(process.env.NEYNAR_API_KEY, "Neynar API key");
}

// Parameter validation utilities
export interface TalentProtocolParams {
  talent_protocol_id?: string | null;
  id?: string | null;
  address?: string | null;
  fid?: string | null;
  account_source?: string | null;
  scorer_slug?: string | null;
}

export function extractTalentProtocolParams(
  searchParams: URLSearchParams,
): TalentProtocolParams {
  return {
    talent_protocol_id: searchParams.get("talent_protocol_id"),
    id: searchParams.get("id"),
    address: searchParams.get("address"),
    fid: searchParams.get("fid"),
    account_source: searchParams.get("account_source"),
    scorer_slug: searchParams.get("scorer_slug"),
  };
}

export function validateTalentProtocolParams(
  params: TalentProtocolParams,
): string | null {
  const {
    talent_protocol_id,
    id,
    address,
    fid,
    account_source = "wallet",
  } = params;

  // If talent_protocol_id or id is provided, no additional validation needed
  if (talent_protocol_id || id) {
    return null;
  }

  // Otherwise, validate based on account_source
  if (account_source === "wallet" && !address) {
    return "Address is required for wallet-based lookup";
  }

  if (account_source === "farcaster" && !fid) {
    return "Farcaster ID (fid) is required for Farcaster-based lookup";
  }

  return null;
}

// Error response utilities
export function createErrorResponse(
  error: string,
  status: number = 400,
): NextResponse {
  return NextResponse.json({ error }, { status });
}

export function createServerErrorResponse(
  error: string = "Internal server error",
): NextResponse {
  return createErrorResponse(error, 500);
}

export function createNotFoundResponse(
  error: string = "Not found",
): NextResponse {
  return createErrorResponse(error, 404);
}

export function createBadRequestResponse(error: string): NextResponse {
  return createErrorResponse(error, 400);
}

// Response content type validation
export function validateJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  return contentType ? contentType.includes("application/json") : false;
}

// Logging utilities
export function logApiError(
  operation: string,
  identifier: string,
  error: string,
  additionalInfo?: Record<string, unknown>,
): void {
  const logInfo = additionalInfo ? JSON.stringify(additionalInfo) : "";
  console.error(
    `[API] ${operation} error for ${identifier}: ${error} ${logInfo}`,
  );
}

// Retry utilities
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 2,
  delayMs: number = 100,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Simple delay between retries
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error("Retry operation failed");
}

// URL construction utilities
export function buildApiUrl(baseUrl: string, params: URLSearchParams): string {
  return `${baseUrl}?${params.toString()}`;
}

export function createTalentApiHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-KEY": apiKey,
    Accept: "application/json",
  };
}
