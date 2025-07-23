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
import { unstable_cache, revalidateTag } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_10_MINUTES } from "./cache-keys";

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

    const response = await fetch(url, {
      headers,
      next: {
        revalidate: 60,
        tags: [url],
      },
    });

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
      const url = buildApiUrl(`${TALENT_API_BASE}/score`, urlParams);
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
      // Transform Farcaster response to match wallet response format
      if (params.account_source === "farcaster" && data.scores?.[0]) {
        const transformed = {
          score: {
            points: data.scores[0].points,
            last_calculated_at: data.scores[0].last_calculated_at,
          },
        };
        console.log(
          "[TalentApiClient.getScore] Transformed Farcaster response:",
          transformed,
        );
        return NextResponse.json(transformed);
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

  async refreshScore(params: TalentProtocolParams): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!params.talent_protocol_id && !params.id) {
      return createBadRequestResponse("Missing talent_protocol_id or id");
    }

    try {
      const urlParams = new URLSearchParams();
      const talentId = params.talent_protocol_id || params.id;
      urlParams.append("id", talentId!);

      if (params.scorer_slug) {
        urlParams.append("scorer_slug", params.scorer_slug);
      }

      const url = `${TALENT_API_BASE}/score/refresh_scorer?${urlParams.toString()}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: createTalentApiHeaders(this.apiKey),
      });

      if (!validateJsonResponse(response)) {
        throw new Error("Invalid response format from Talent API");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      const identifier = params.talent_protocol_id || params.id;
      logApiError(
        "refreshScore",
        identifier || "unknown",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to refresh talent score");
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

    if (!params.id && !params.talent_protocol_id) {
      return createBadRequestResponse("No identifier provided");
    }

    try {
      const urlParams = new URLSearchParams();

      // Handle talent_protocol_id (UUID) vs id (account lookup)
      if (params.talent_protocol_id) {
        urlParams.append("id", params.talent_protocol_id);
      } else {
        urlParams.append("id", params.id!);
        if (params.account_source) {
          urlParams.append("account_source", params.account_source);
        }
      }
      urlParams.append("scorer_slug", "creator_score");

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
      const rank = profile.rank_position || null;

      return NextResponse.json({
        id: talentUuid,
        fid,
        wallet,
        github,
        fname,
        rank,
        display_name: profile.display_name || profile.name || null,
        image_url: profile.image_url || null,
        main_wallet_address: profile.main_wallet_address || null,
        farcaster_primary_wallet_address:
          profile.farcaster_primary_wallet_address || null,
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

  async getPosts(params: TalentProtocolParams): Promise<NextResponse> {
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

      // Add pagination parameters if provided
      if (params.page) {
        urlParams.append("page", params.page);
      }
      if (params.per_page) {
        urlParams.append("per_page", params.per_page);
      }

      const data = await this.makeRequest(
        "/creator_posts/profile_posts",
        urlParams,
      );
      return NextResponse.json(data);
    } catch (error) {
      const identifier = params.talent_protocol_id || params.id;

      if (error instanceof Error && error.message.includes("404")) {
        return NextResponse.json(
          { error: "Talent API returned 404", posts: [] },
          { status: 502 },
        );
      }

      logApiError(
        "getPosts",
        identifier || "unknown",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to fetch posts");
    }
  }

  async getAccounts(params: TalentProtocolParams): Promise<NextResponse> {
    const errorMessage = validateTalentProtocolParams(params);
    if (errorMessage) {
      return createBadRequestResponse(errorMessage);
    }

    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    try {
      const urlParams = this.buildRequestParams(params);
      const response = await this.makeRequest("/accounts", urlParams);

      if (!response || !response.accounts) {
        return createNotFoundResponse(
          "No accounts found for the specified criteria",
        );
      }

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      logApiError(
        "getAccounts",
        params.id || params.talent_protocol_id || "unknown",
        error instanceof Error ? error.message : "Unknown error",
      );
      return createServerErrorResponse(
        `Failed to fetch accounts: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get humanity credentials for a talent protocol user
   */
  async getHumanityCredentials(
    params: TalentProtocolParams,
  ): Promise<NextResponse> {
    const errorMessage = validateTalentProtocolParams(params);
    if (errorMessage) {
      return createBadRequestResponse(errorMessage);
    }

    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    try {
      const urlParams = new URLSearchParams();
      const talentId = params.talent_protocol_id || params.id;
      if (talentId) {
        urlParams.append("talent_id", talentId);
      }

      const response = await this.makeRequest("/human_checkmark", urlParams);

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      logApiError(
        "getHumanityCredentials",
        params.id || params.talent_protocol_id || "unknown",
        error instanceof Error ? error.message : "Unknown error",
      );

      // Return empty credentials array on 404 instead of error
      if (error instanceof Error && error.message.includes("404")) {
        return NextResponse.json({ credentials: [] }, { status: 200 });
      }

      return createServerErrorResponse(
        `Failed to fetch humanity credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Search for profiles by identity using the Talent Protocol search API
   */
  async searchProfiles(params: {
    query: string;
    page?: number;
    per_page?: number;
  }): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!params.query || params.query.trim().length < 2) {
      return createBadRequestResponse(
        "Query must be at least 2 characters long",
      );
    }

    try {
      const requestData = {
        query: {
          identity: params.query.trim(),
        },
        sort: {
          score: { order: "desc", scorer: "Creator Score" },
          id: { order: "desc" },
        },
        page: params.page || 1,
        per_page: Math.min(params.per_page || 10, 25), // API limit is 25 for free user
      };

      // Convert request data to URL-encoded query parameters as per API docs
      const queryParams = new URLSearchParams();
      Object.keys(requestData).forEach((key) => {
        queryParams.append(
          key,
          JSON.stringify(requestData[key as keyof typeof requestData]),
        );
      });

      const queryString = queryParams.toString();

      const cachedSearchProfiles = unstable_cache(
        async () => {
          const url = `${TALENT_API_BASE}/search/advanced/profiles?${queryString}&view=scores_minimal`;

          console.log("Starting searchProfiles request");
          console.log("current time", new Date().toISOString());
          console.log("Request URL: ", url);
          const response = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": this.apiKey,
            },
          });
          console.log("searchProfiles request end");
          console.log("current time", new Date().toISOString());

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Talent API error (${response.status}): ${errorText}`,
            );
          }

          const data = await response.json();
          return data;
        },
        [`${CACHE_KEYS.PROFILE_SEARCH}-${queryString}`], // Cache key
        { revalidate: CACHE_DURATION_10_MINUTES }, // Revalidate every 10 minutes
      );

      const data = await cachedSearchProfiles();
      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      logApiError(
        "searchProfiles",
        params.query,
        error instanceof Error ? error.message : "Unknown error",
      );

      // Revalidate cache on error
      const requestData = {
        query: {
          identity: params.query.trim(),
        },
        sort: {
          score: {
            order: "desc",
          },
        },
        page: params.page || 1,
        per_page: Math.min(params.per_page || 10, 25),
        view: "scores_minimal",
      };
      const queryParams = new URLSearchParams();
      Object.keys(requestData).forEach((key) => {
        queryParams.append(
          key,
          JSON.stringify(requestData[key as keyof typeof requestData]),
        );
      });
      revalidateTag(`${CACHE_KEYS.PROFILE_SEARCH}-${queryParams.toString()}`);

      return createServerErrorResponse(
        `Failed to search profiles: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Export a default instance
export const talentApiClient = new TalentApiClient();
