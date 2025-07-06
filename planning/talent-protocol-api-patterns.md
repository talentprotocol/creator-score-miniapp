# Talent Protocol API Client Patterns and Error Handling

## Overview

This document outlines the established patterns for integrating with the Talent Protocol API, including error handling, parameter validation, and response transformation patterns. Follow these patterns exactly to ensure consistency and reliability.

## Core Architecture

### Main API Client Class

```typescript
export class TalentApiClient {
  private apiKey: string;
  
  constructor(options: TalentApiClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.TALENT_API_KEY!;
  }
  
  // Private method for consistent request handling
  private async makeRequest(endpoint: string, params: URLSearchParams) {
    const url = buildApiUrl(`${TALENT_API_BASE}${endpoint}`, params);
    const headers = createTalentApiHeaders(this.apiKey);
    
    const response = await fetch(url, { headers });
    
    if (!validateJsonResponse(response)) {
      throw new Error("Invalid response format from Talent API");
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  }
}
```

## Key Patterns

### 1. Parameter Validation & Extraction

```typescript
export interface TalentProtocolParams {
  talent_protocol_id?: string | null;
  id?: string | null;
  address?: string | null;
  fid?: string | null;
  account_source?: string | null;
  scorer_slug?: string | null;
}

// Extract parameters from URL search params
export function extractTalentProtocolParams(searchParams: URLSearchParams): TalentProtocolParams {
  return {
    talent_protocol_id: searchParams.get("talent_protocol_id"),
    id: searchParams.get("id"),
    address: searchParams.get("address"),
    fid: searchParams.get("fid"),
    account_source: searchParams.get("account_source"),
    scorer_slug: searchParams.get("scorer_slug"),
  };
}

// Validate parameters based on account source
export function validateTalentProtocolParams(params: TalentProtocolParams): string | null {
  const { talent_protocol_id, id, address, fid, account_source = "wallet" } = params;
  
  // If talent_protocol_id or id is provided, no additional validation needed
  if (talent_protocol_id || id) return null;
  
  // Otherwise, validate based on account_source
  if (account_source === "wallet" && !address) {
    return "Address is required for wallet-based lookup";
  }
  
  if (account_source === "farcaster" && !fid) {
    return "Farcaster ID (fid) is required for Farcaster-based lookup";
  }
  
  return null;
}
```

### 2. Standardized Error Responses

```typescript
// Error response utilities
export function createErrorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({ error }, { status });
}

export function createServerErrorResponse(error: string = "Internal server error"): NextResponse {
  return createErrorResponse(error, 500);
}

export function createNotFoundResponse(error: string = "Not found"): NextResponse {
  return createErrorResponse(error, 404);
}

export function createBadRequestResponse(error: string): NextResponse {
  return createErrorResponse(error, 400);
}
```

### 3. Consistent Error Handling Pattern

```typescript
async getScore(params: TalentProtocolParams): Promise<NextResponse> {
  // 1. Validate API key
  const apiKeyError = this.validateApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }
  
  // 2. Validate parameters
  const validationError = validateTalentProtocolParams(params);
  if (validationError) {
    return createBadRequestResponse(validationError);
  }
  
  try {
    // 3. Make API call
    const urlParams = this.buildRequestParams(params);
    const data = await this.makeRequest("/score", urlParams);
    
    // 4. Transform response if needed
    if (params.account_source === "farcaster" && data.scores?.[0]) {
      return NextResponse.json({
        score: {
          points: data.scores[0].points,
          last_calculated_at: data.scores[0].last_calculated_at,
        },
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    // 5. Log and handle errors
    const identifier = params.account_source === "wallet" ? params.address : params.fid;
    logApiError("getScore", identifier || "unknown", error instanceof Error ? error.message : String(error));
    return createServerErrorResponse("Failed to fetch talent score");
  }
}
```

### 4. Request Building with Flexible Parameters

```typescript
private buildRequestParams(params: TalentProtocolParams): URLSearchParams {
  const urlParams = new URLSearchParams();
  
  // Handle talent_protocol_id or id first (direct lookup)
  const talentId = params.talent_protocol_id || params.id;
  if (talentId) {
    urlParams.append("id", talentId);
    if (params.scorer_slug) {
      urlParams.append("scorer_slug", params.scorer_slug);
    }
    return urlParams;
  }
  
  // Handle address/fid based lookup
  const accountSource = params.account_source || "wallet";
  
  if (accountSource === "wallet" && params.address) {
    urlParams.append("id", params.address);
  } else if (accountSource === "farcaster" && params.fid) {
    urlParams.append("id", params.fid);
  }
  
  urlParams.append("account_source", accountSource);
  
  if (params.scorer_slug) {
    urlParams.append("scorer_slug", params.scorer_slug);
  }
  
  return urlParams;
}
```

### 5. Retry Logic with Exponential Backoff

```typescript
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
```

### 6. Specialized Error Handling for Different Endpoints

```typescript
// Example: Handle 404s differently for getSocials
async getSocials(params: TalentProtocolParams): Promise<NextResponse> {
  // ... validation code ...
  
  try {
    const data = await this.makeRequest("/socials", urlParams);
    return NextResponse.json(data);
  } catch (error) {
    const identifier = params.talent_protocol_id || params.id;
    
    // Special handling for 404s
    if (error instanceof Error && error.message.includes("404")) {
      return NextResponse.json({ error: "Talent API returned 404", data: {} }, { status: 502 });
    }
    
    logApiError("getSocials", identifier || "unknown", error instanceof Error ? error.message : String(error));
    return createServerErrorResponse("Failed to fetch social accounts");
  }
}
```

## API Route Structure

### Consistent Route Pattern

```typescript
// app/api/talent-score/route.ts
import { NextRequest } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";
import { extractTalentProtocolParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = extractTalentProtocolParams(searchParams);
  
  return talentApiClient.getScore(params);
}
```

## Utility Functions

### API Key Validation

```typescript
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
```

### Response Validation

```typescript
export function validateJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  return contentType ? contentType.includes("application/json") : false;
}
```

### Logging

```typescript
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
```

### URL Construction

```typescript
export function buildApiUrl(baseUrl: string, params: URLSearchParams): string {
  return `${baseUrl}?${params.toString()}`;
}

export function createTalentApiHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-KEY": apiKey,
    Accept: "application/json",
  };
}
```

## Supported Endpoints

### 1. Score Endpoint
- **URL**: `/score`
- **Method**: `getScore(params)`
- **Transforms**: Farcaster responses to match wallet response format

### 2. Credentials Endpoint
- **URL**: `/credentials`
- **Method**: `getCredentials(params)`
- **Returns**: Raw credential data

### 3. Socials Endpoint
- **URL**: `/socials`
- **Method**: `getSocials(params)`
- **Special handling**: Returns 502 for 404s from upstream

### 4. Profile Endpoint
- **URL**: `/profile`
- **Method**: `getProfile(params)`
- **Transforms**: Normalizes profile data with extracted accounts

## Key Benefits

1. **Centralized Error Handling**: All API errors are handled consistently
2. **Parameter Validation**: Comprehensive validation before making requests
3. **Flexible Parameter Handling**: Supports multiple identification methods (wallet, farcaster, talent_id)
4. **Retry Logic**: Built-in retry mechanism for resilient API calls
5. **Response Transformation**: Consistent response format across different endpoints
6. **Logging**: Comprehensive error logging for debugging
7. **Type Safety**: Strong TypeScript interfaces for parameters and responses

## Usage Guidelines

1. Always use the `TalentApiClient` class for API calls
2. Extract parameters using `extractTalentProtocolParams()`
3. Validate parameters before making requests
4. Handle errors using the standardized error response functions
5. Log errors with appropriate context
6. Use retry logic for resilient operations
7. Transform responses as needed for consistent client-side consumption

This pattern ensures reliable, maintainable, and consistent interaction with the Talent Protocol API across your entire application. 