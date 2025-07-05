import {
  TalentProtocolParams,
  validateTalentApiKey,
  validateTalentProtocolParams,
  buildApiUrl,
  createTalentApiHeaders,
  validateJsonResponse,
  logApiError,
  createServerErrorResponse,
  createBadRequestResponse,
  createNotFoundResponse,
} from "./api-utils";
import { NextResponse } from "next/server";

// API endpoints
const TALENT_API_BASE = "https://api.talentprotocol.com";

export interface TalentApiClientOptions {
  apiKey?: string;
}

export class TalentApiClient {
  private apiKey: string;

  constructor(options: TalentApiClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.TALENT_API_KEY || "";
  }

  private validateApiKey(): string | null {
    return validateTalentApiKey();
  }

  private buildRequestParams(params: TalentProtocolParams): URLSearchParams {
    const urlParams = new URLSearchParams();

    // Handle talent_protocol_id or id first
    const talentId = params.talent_protocol_id || params.id;
    if (talentId) {
      urlParams.append("id", talentId);
      // Add scorer_slug if provided
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

  private async makeRequest(
    endpoint: string,
    params: URLSearchParams,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const url = buildApiUrl(`${TALENT_API_BASE}${endpoint}`, params);
    const headers = createTalentApiHeaders(this.apiKey);

    const response = await fetch(url, { headers });

    if (!validateJsonResponse(response)) {
      throw new Error("Invalid response format from Talent API");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return data;
  }

  async getScore(params: TalentProtocolParams): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    const validationError = validateTalentProtocolParams(params);
    if (validationError) {
      return createBadRequestResponse(validationError);
    }

    try {
      const urlParams = this.buildRequestParams(params);
      const data = await this.makeRequest("/score", urlParams);

      // Transform Farcaster response to match wallet response format
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
      const identifier =
        params.account_source === "wallet" ? params.address : params.fid;
      logApiError(
        "getScore",
        identifier || "unknown",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to fetch talent score");
    }
  }

  async getCredentials(params: TalentProtocolParams): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    const validationError = validateTalentProtocolParams(params);
    if (validationError) {
      return createBadRequestResponse(validationError);
    }

    try {
      const urlParams = this.buildRequestParams(params);
      const data = await this.makeRequest("/credentials", urlParams);
      return NextResponse.json(data);
    } catch (error) {
      const identifier =
        params.account_source === "wallet" ? params.address : params.fid;
      logApiError(
        "getCredentials",
        identifier || "unknown",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to fetch credentials");
    }
  }

  async getSocials(params: TalentProtocolParams): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!params.talent_protocol_id && !params.id) {
      return createBadRequestResponse("Missing id");
    }

    try {
      const urlParams = new URLSearchParams();
      const talentId = params.talent_protocol_id || params.id;

      if (params.talent_protocol_id) {
        // Direct talent ID lookup
        urlParams.append("id", talentId!);
      } else {
        // Account source lookup
        urlParams.append("id", talentId!);
        const accountSource = params.account_source || "farcaster";
        urlParams.append("account_source", accountSource);
      }

      const data = await this.makeRequest("/socials", urlParams);
      return NextResponse.json(data);
    } catch (error) {
      const identifier = params.talent_protocol_id || params.id;

      if (error instanceof Error && error.message.includes("404")) {
        return NextResponse.json(
          { error: "Talent API returned 404", data: {} },
          { status: 502 },
        );
      }

      logApiError(
        "getSocials",
        identifier || "unknown",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to fetch social accounts");
    }
  }

  async getProfile(params: TalentProtocolParams): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!params.id) {
      return createBadRequestResponse("No identifier provided");
    }

    try {
      const urlParams = new URLSearchParams();
      urlParams.append("id", params.id);

      if (params.account_source) {
        urlParams.append("account_source", params.account_source);
      }

      const data = await this.makeRequest("/profile", urlParams);

      if (!data.profile) {
        return createNotFoundResponse("User not found");
      }

      // Extract and normalize profile data
      const profile = data.profile;
      const accounts = Array.isArray(profile.accounts) ? profile.accounts : [];

      const farcasterAccount = accounts.find(
        (acc: { source: string; username?: string }) =>
          acc.source === "farcaster" && acc.username,
      );
      const fid = farcasterAccount ? Number(farcasterAccount.identifier) : null;

      const walletAccount = accounts.find(
        (acc: { identifier: string; source: string }) =>
          acc.source === "wallet" &&
          acc.identifier &&
          acc.identifier.startsWith("0x"),
      );
      const wallet = walletAccount
        ? walletAccount.identifier
        : profile.user?.main_wallet || null;

      const githubAccount = accounts.find(
        (acc: { username?: string; source: string }) =>
          acc.source === "github" && acc.username,
      );

      const fname = farcasterAccount?.username || null;
      const github = githubAccount ? githubAccount.username : null;
      const talentUuid: string | null = profile.id || null;

      return NextResponse.json({
        id: talentUuid,
        fid,
        wallet,
        github,
        fname,
        display_name: profile.display_name || profile.name || null,
        image_url: profile.image_url || null,
        ...profile,
      });
    } catch (error) {
      logApiError(
        "getProfile",
        params.id || "unknown",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to fetch user data");
    }
  }
}

// Export a default instance
export const talentApiClient = new TalentApiClient();
