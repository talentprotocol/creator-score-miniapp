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
import { dlog, dtimer } from "./debug";

// API endpoints
const TALENT_API_BASE = "https://api.talentprotocol.com";

export interface TalentApiClientOptions {
  apiKey?: string;
  userAuthToken?: string;
}

export class TalentApiClient {
  private apiKey: string;
  private userAuthToken?: string;

  constructor(options: TalentApiClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.TALENT_API_KEY || "";
    this.userAuthToken = options.userAuthToken;
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

  private createHeaders(): Record<string, string> {
    const headers = createTalentApiHeaders(this.apiKey);
    if (this.userAuthToken) {
      // Pass through user auth token when available
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.userAuthToken}`;
    }
    return headers;
  }

  private async makeRequest(
    endpoint: string,
    params: URLSearchParams,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const requestTimer = dtimer("TalentAPI", `makeRequest_${endpoint}`);
    const url = buildApiUrl(`${TALENT_API_BASE}${endpoint}`, params);
    const headers = this.createHeaders();

    dlog("TalentAPI", "makeRequest_start", {
      endpoint,
      url: url.replace(process.env.TALENT_API_KEY || "", "[REDACTED]"),
      params_count: params.size,
      param_keys: Array.from(params.keys()),
    });

    try {
      const response = await fetch(url, {
        headers,
        ...(this.userAuthToken
          ? { cache: "no-store" }
          : {
              next: {
                revalidate: 60,
                tags: [url],
              },
            }),
      });

      const responseTimer = dtimer("TalentAPI", `response_${endpoint}`);

      dlog("TalentAPI", "makeRequest_response", {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers_content_type: response.headers.get("content-type"),
      });

      if (!validateJsonResponse(response)) {
        dlog("TalentAPI", "makeRequest_invalid_response_format", {
          endpoint,
          status: response.status,
          content_type: response.headers.get("content-type"),
        });
        throw new Error("Invalid response format from Talent API");
      }

      type JsonRecord = Record<string, unknown> | null;
      let data: JsonRecord = null;
      try {
        data = (await response.json()) as JsonRecord;
      } catch {}
      responseTimer.end();

      if (!response.ok) {
        dlog("TalentAPI", "makeRequest_error_response", {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error_message: (data && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error?: string }).error
            : "No error message"),
          data_keys: data ? Object.keys(data) : [],
        });
        const msg =
          (data && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error?: string }).error
            : undefined) ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(msg);
      }

      dlog("TalentAPI", "makeRequest_success", {
        endpoint,
        status: response.status,
        data_keys: data ? Object.keys(data) : [],
        has_profile: !!(data as Record<string, unknown> | null)?.profile,
        has_scores: !!(data as Record<string, unknown> | null)?.scores,
        has_socials: !!(data as Record<string, unknown> | null)?.socials,
        has_credentials: !!(data as Record<string, unknown> | null)?.credentials,
        has_posts: !!(data as Record<string, unknown> | null)?.posts,
      });

      requestTimer.end();
      return data;
    } catch (error) {
      dlog("TalentAPI", "makeRequest_exception", {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        error_type:
          error instanceof Error ? error.constructor.name : typeof error,
      });
      requestTimer.end();
      throw error;
    }
  }

  async getScore(params: TalentProtocolParams): Promise<NextResponse> {
    const methodTimer = dtimer("TalentAPI", "getScore");

    dlog("TalentAPI", "getScore_start", {
      params: {
        id: params.id,
        talent_protocol_id: params.talent_protocol_id,
        account_source: params.account_source,
        scorer_slug: params.scorer_slug,
      },
    });

    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      dlog("TalentAPI", "getScore_api_key_error", { error: apiKeyError });
      methodTimer.end();
      return createServerErrorResponse(apiKeyError);
    }

    const validationError = validateTalentProtocolParams(params);
    if (validationError) {
      dlog("TalentAPI", "getScore_validation_error", {
        error: validationError,
      });
      methodTimer.end();
      return createBadRequestResponse(validationError);
    }

    try {
      const urlParams = this.buildRequestParams(params);
      const url = buildApiUrl(`${TALENT_API_BASE}/score`, urlParams);
      const headers = this.createHeaders();

      dlog("TalentAPI", "getScore_request", {
        url: url.replace(process.env.TALENT_API_KEY || "", "[REDACTED]"),
        url_params: Object.fromEntries(urlParams.entries()),
      });

      const response = await fetch(url, {
        headers,
        ...(this.userAuthToken ? { cache: "no-store" } : {}),
      });

      dlog("TalentAPI", "getScore_response", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!validateJsonResponse(response)) {
        dlog("TalentAPI", "getScore_invalid_response_format", {
          status: response.status,
          content_type: response.headers.get("content-type"),
        });
        throw new Error("Invalid response format from Talent API");
      }

      const data = await response.json();

      if (!response.ok) {
        dlog("TalentAPI", "getScore_error_response", {
          status: response.status,
          statusText: response.statusText,
          error_message: data?.error || "No error message",
        });
        const msg =
          (data && typeof data.error === "string" && data.error) ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(msg);
      }

      // Transform Farcaster response to match wallet response format
      if (params.account_source === "farcaster" && data.scores?.[0]) {
        const transformed = {
          score: {
            points: data.scores[0].points,
            last_calculated_at: data.scores[0].last_calculated_at,
          },
        };

        dlog("TalentAPI", "getScore_farcaster_transformed", {
          original_scores_count: data.scores?.length || 0,
          transformed_score: transformed.score.points,
        });

        methodTimer.end();
        return NextResponse.json(transformed);
      }

      dlog("TalentAPI", "getScore_success", {
        has_score: !!data.score,
        score_points: data.score?.points || 0,
        has_scores: !!data.scores,
        scores_count: data.scores?.length || 0,
      });

      methodTimer.end();
      return NextResponse.json(data);
    } catch (error) {
      const identifier =
        params.account_source === "wallet" ? params.address : params.fid;
      logApiError(
        "getScore",
        identifier || "unknown",
        error instanceof Error ? error.message : String(error),
      );

      methodTimer.end();
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
    const methodTimer = dtimer("TalentAPI", "getProfile");

    dlog("TalentAPI", "getProfile_start", {
      params: {
        id: params.id,
        talent_protocol_id: params.talent_protocol_id,
        account_source: params.account_source,
      },
    });

    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      dlog("TalentAPI", "getProfile_api_key_error", { error: apiKeyError });
      methodTimer.end();
      return createServerErrorResponse(apiKeyError);
    }

    if (!params.id && !params.talent_protocol_id) {
      dlog("TalentAPI", "getProfile_no_identifier", { params });
      methodTimer.end();
      return createBadRequestResponse("No identifier provided");
    }

    try {
      const urlParams = new URLSearchParams();

      // Handle talent_protocol_id (UUID) vs id (account lookup)
      if (params.talent_protocol_id) {
        urlParams.append("id", params.talent_protocol_id.toLowerCase());
        dlog("TalentAPI", "getProfile_uuid_lookup", {
          talent_protocol_id: params.talent_protocol_id,
          normalized_id: params.talent_protocol_id.toLowerCase(),
        });
      } else {
        urlParams.append("id", params.id!.toLowerCase());
        if (params.account_source) {
          urlParams.append("account_source", params.account_source);
        }
        dlog("TalentAPI", "getProfile_account_lookup", {
          id: params.id,
          account_source: params.account_source,
          normalized_id: params.id!.toLowerCase(),
        });
      }
      urlParams.append("scorer_slug", "creator_score");

      dlog("TalentAPI", "getProfile_final_params", {
        url_params: Object.fromEntries(urlParams.entries()),
      });

      const data = await this.makeRequest("/profile", urlParams);

      if (!data.profile) {
        dlog("TalentAPI", "getProfile_no_profile_in_response", {
          data_keys: data ? Object.keys(data) : [],
          has_profile: !!data.profile,
        });
        methodTimer.end();
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

      const result = {
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
      };

      dlog("TalentAPI", "getProfile_success", {
        profile_id: talentUuid,
        fid,
        fname,
        wallet,
        github,
        rank,
        accounts_count: accounts.length,
        account_sources: accounts.map((acc: { source: string }) => acc.source),
      });

      methodTimer.end();
      return NextResponse.json(result);
    } catch (error) {
      logApiError(
        "getProfile",
        params.id || "unknown",
        error instanceof Error ? error.message : String(error),
        { source: params.account_source },
      );

      if (
        error instanceof Error &&
        error.message.includes("Resource not found")
      ) {
        dlog("TalentAPI", "getProfile_resource_not_found", {
          identifier: params.id || params.talent_protocol_id,
          account_source: params.account_source,
        });
        methodTimer.end();
        return createNotFoundResponse("User not found");
      }

      methodTimer.end();
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

  /**
   * Fetch available tags for profiles
   */
  async getTags(): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    try {
      const url = `${TALENT_API_BASE}/tags`;
      const resp = await fetch(url, {
        method: "GET",
        headers: this.createHeaders(),
      });

      if (!validateJsonResponse(resp)) {
        throw new Error("Invalid response format from Talent API");
      }
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(
          data?.error || `HTTP ${resp.status}: ${resp.statusText}`,
        );
      }
      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      logApiError(
        "getTags",
        "self",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to fetch tags");
    }
  }

  /**
   * Update current user's profile (requires end-user Authorization token)
   * Supported fields: bio, display_name, location, tags
   */
  async updateProfile(data: {
    bio?: string | null;
    display_name?: string | null;
    location?: string | null;
    tags?: string[] | null;
  }): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!this.userAuthToken) {
      return createBadRequestResponse("Missing user auth token");
    }

    try {
      const url = `${TALENT_API_BASE}/profile`;
      const resp = await fetch(url, {
        method: "PUT",
        headers: {
          ...this.createHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!validateJsonResponse(resp)) {
        throw new Error("Invalid response format from Talent API");
      }
      const respData = await resp.json();
      if (!resp.ok) {
        // Pass through upstream status and message when possible
        return NextResponse.json(respData, { status: resp.status });
      }
      return NextResponse.json(respData, { status: 200 });
    } catch (error) {
      logApiError(
        "updateProfile",
        "self",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to update profile");
    }
  }

  /**
   * Update current user (requires end-user Authorization token)
   * Supported fields: email
   */
  async updateUser(data: { email?: string }): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!this.userAuthToken) {
      return createBadRequestResponse("Missing user auth token");
    }

    try {
      const url = `${TALENT_API_BASE}/users`;
      const resp = await fetch(url, {
        method: "PUT",
        headers: {
          ...this.createHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!validateJsonResponse(resp)) {
        throw new Error("Invalid response format from Talent API");
      }
      const respData = await resp.json();

      if (!resp.ok) {
        throw new Error(
          respData.error || `HTTP ${resp.status}: ${resp.statusText}`,
        );
      }

      return NextResponse.json(respData, { status: 200 });
    } catch (error) {
      logApiError(
        "updateUser",
        "self",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to update user");
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
   * Connect a new wallet account to the current user (requires end-user Authorization token)
   */
  async connectWalletAccount(params: {
    address: string;
    signature: string;
    chain_id: number;
  }): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!this.userAuthToken) {
      return createBadRequestResponse("Missing user auth token");
    }

    try {
      const url = `${TALENT_API_BASE}/accounts`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          ...this.createHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!validateJsonResponse(resp)) {
        throw new Error("Invalid response format from Talent API");
      }
      const data = await resp.json();

      if (!resp.ok) {
        // Pass through upstream status and error details for better UX
        return NextResponse.json(data, { status: resp.status });
      }

      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      logApiError(
        "connectWalletAccount",
        params.address,
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to connect wallet account");
    }
  }

  /**
   * Create a user-specific nonce for connecting a wallet (requires end-user Authorization token)
   */
  async createUserNonce(): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!this.userAuthToken) {
      return createBadRequestResponse("Missing user auth token");
    }

    try {
      const url = `${TALENT_API_BASE}/user_nonces`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          ...this.createHeaders(),
          "Content-Type": "application/json",
        },
      });

      if (!validateJsonResponse(resp)) {
        throw new Error("Invalid response format from Talent API");
      }
      const data = await resp.json();

      if (!resp.ok) {
        return NextResponse.json(data, { status: resp.status });
      }

      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      logApiError(
        "createUserNonce",
        "self",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to create user nonce");
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
   * Disconnect social account (requires end-user Authorization token)
   */
  async disconnectAccount(platform: "github" | "twitter" | "linkedin"): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    if (!this.userAuthToken) {
      return createBadRequestResponse("Missing user auth token");
    }

    const endpointMap: Record<string, string> = {
      github: "/accounts/disconnect_github",
      twitter: "/accounts/disconnect_twitter",
      linkedin: "/accounts/disconnect_linkedin",
    };

    const path = endpointMap[platform];
    if (!path) {
      return createBadRequestResponse("Unsupported platform");
    }

    try {
      const url = `${TALENT_API_BASE}${path}`;
      const resp = await fetch(url, {
        method: "PUT",
        headers: this.createHeaders(),
      });

      if (!validateJsonResponse(resp)) {
        throw new Error("Invalid response format from Talent API");
      }
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(
          data.error || `HTTP ${resp.status}: ${resp.statusText}`,
        );
      }

      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      logApiError(
        "disconnectAccount",
        platform,
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse("Failed to disconnect account");
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

          const response = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": this.apiKey,
            },
          });

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

  /**
   * Get the total number of profiles with Creator Score > 0 using the
   * Advanced Search endpoint pagination metadata.
   * Note: Caching is handled at the service layer; this method performs a direct fetch.
   */
  async getActiveCreatorsCount(): Promise<NextResponse> {
    const apiKeyError = this.validateApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    try {
      const requestData = {
        query: { score: { min: 1, scorer: "Creator Score" } },
        returnItems: false,
        per_page: 25,
        page: 1,
      } as const;

      const queryParams = new URLSearchParams();
      Object.entries(requestData).forEach(([key, value]) => {
        queryParams.append(key, JSON.stringify(value));
      });

      const url = `${TALENT_API_BASE}/search/advanced/profiles?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-KEY": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Talent API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const total = data?.pagination?.total ?? 0;
      return NextResponse.json({ total }, { status: 200 });
    } catch (error) {
      logApiError(
        "getActiveCreatorsCount",
        "advanced_search",
        error instanceof Error ? error.message : String(error),
      );
      return createServerErrorResponse(
        `Failed to fetch active creators count: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Export a default instance
export const talentApiClient = new TalentApiClient();

// Auth helpers
export async function createTalentAuthNonce(
  address: string,
  chainId?: number,
): Promise<NextResponse> {
  const apiKeyError = validateTalentApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }

  try {
    const resp = await fetch(`${TALENT_API_BASE}/auth/create_nonce`, {
      method: "POST",
      headers: {
        ...createTalentApiHeaders(process.env.TALENT_API_KEY || ""),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, chain_id: chainId }),
    });

    if (!validateJsonResponse(resp)) {
      throw new Error("Invalid response format from Talent API");
    }
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || `HTTP ${resp.status}: ${resp.statusText}`);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logApiError(
      "create_nonce",
      address,
      error instanceof Error ? error.message : String(error),
    );
    return createServerErrorResponse("Failed to create auth nonce");
  }
}

// Email accounts (requires end-user Authorization token)
export async function getEmailAccountsWithAuth(
  userAuthToken: string,
): Promise<NextResponse> {
  const apiKeyError = validateTalentApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }

  if (!userAuthToken) {
    return createBadRequestResponse("Missing user auth token");
  }

  try {
    const resp = await fetch(`${TALENT_API_BASE}/email_accounts`, {
      method: "GET",
      headers: {
        ...createTalentApiHeaders(process.env.TALENT_API_KEY || ""),
        Authorization: `Bearer ${userAuthToken}`,
      },
    });

    if (!validateJsonResponse(resp)) {
      throw new Error("Invalid response format from Talent API");
    }
    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(data, { status: resp.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logApiError(
      "getEmailAccounts",
      "self",
      error instanceof Error ? error.message : String(error),
    );
    return createServerErrorResponse("Failed to fetch email accounts");
  }
}

// Resend email verification (requires end-user Authorization token)
export async function resendEmailVerificationWithAuth(
  userAuthToken: string,
  emailAccountId: number | string,
  redirectToUrl?: string,
): Promise<NextResponse> {
  const apiKeyError = validateTalentApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }

  if (!userAuthToken) {
    return createBadRequestResponse("Missing user auth token");
  }

  if (!emailAccountId && emailAccountId !== 0) {
    return createBadRequestResponse("Missing email account id");
  }

  try {
    const url = `${TALENT_API_BASE}/email_accounts/${encodeURIComponent(String(emailAccountId))}/resend_verification`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...createTalentApiHeaders(process.env.TALENT_API_KEY || ""),
        Authorization: `Bearer ${userAuthToken}`,
        "Content-Type": "application/json",
      },
      body: redirectToUrl ? JSON.stringify({ redirect_to_url: redirectToUrl }) : undefined,
    });

    // Some APIs return 204 No Content on success
    if (resp.status === 204) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      if (!resp.ok) {
        return NextResponse.json(data, { status: resp.status });
      }
      return NextResponse.json(data, { status: 200 });
    }

    // Fallback for non-JSON responses
    const text = await resp.text();
    if (!resp.ok) {
      return NextResponse.json({ error: text || "Request failed" }, { status: resp.status });
    }
    return NextResponse.json({ ok: true, message: text }, { status: 200 });
  } catch (error) {
    logApiError(
      "resendEmailVerification",
      String(emailAccountId),
      error instanceof Error ? error.message : String(error),
    );
    return createServerErrorResponse("Failed to resend email verification");
  }
}

// Create/connect a new email account (requires end-user Authorization token)
export async function createEmailAccountWithAuth(
  userAuthToken: string,
  emailAddress: string,
  redirectToUrl?: string,
): Promise<NextResponse> {
  const apiKeyError = validateTalentApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }

  if (!userAuthToken) {
    return createBadRequestResponse("Missing user auth token");
  }
  if (!emailAddress || typeof emailAddress !== "string") {
    return createBadRequestResponse("Missing or invalid email address");
  }

  try {
    const url = `${TALENT_API_BASE}/email_accounts`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...createTalentApiHeaders(process.env.TALENT_API_KEY || ""),
        Authorization: `Bearer ${userAuthToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        redirectToUrl ? { email: emailAddress, redirect_to_url: redirectToUrl } : { email: emailAddress },
      ),
    });

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      if (!resp.ok) {
        return NextResponse.json(data, { status: resp.status });
      }
      return NextResponse.json(data, { status: 200 });
    }

    // Fallback for non-JSON responses
    const text = await resp.text();
    if (!resp.ok) {
      return NextResponse.json({ error: text || "Request failed" }, { status: resp.status });
    }
    return NextResponse.json({ ok: true, message: text }, { status: 200 });
  } catch (error) {
    logApiError(
      "createEmailAccount",
      emailAddress,
      error instanceof Error ? error.message : String(error),
    );
    return createServerErrorResponse("Failed to create email account");
  }
}

// Make an email account primary (requires end-user Authorization token)
export async function makePrimaryEmailAccountWithAuth(
  userAuthToken: string,
  emailAccountId: number | string,
): Promise<NextResponse> {
  const apiKeyError = validateTalentApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }

  if (!userAuthToken) {
    return createBadRequestResponse("Missing user auth token");
  }
  if (emailAccountId === undefined || emailAccountId === null) {
    return createBadRequestResponse("Missing email account id");
  }

  try {
    const url = `${TALENT_API_BASE}/email_accounts/${encodeURIComponent(String(emailAccountId))}/make_primary`;
    const resp = await fetch(url, {
      method: "PUT",
      headers: {
        ...createTalentApiHeaders(process.env.TALENT_API_KEY || ""),
        Authorization: `Bearer ${userAuthToken}`,
      },
    });

    if (resp.status === 204) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      if (!resp.ok) {
        return NextResponse.json(data, { status: resp.status });
      }
      return NextResponse.json(data, { status: 200 });
    }

    const text = await resp.text();
    if (!resp.ok) {
      return NextResponse.json({ error: text || "Request failed" }, { status: resp.status });
    }
    return NextResponse.json({ ok: true, message: text }, { status: 200 });
  } catch (error) {
    logApiError(
      "makePrimaryEmailAccount",
      String(emailAccountId),
      error instanceof Error ? error.message : String(error),
    );
    return createServerErrorResponse("Failed to set primary email account");
  }
}

// Disconnect/remove an email account (requires end-user Authorization token)
export async function disconnectEmailAccountWithAuth(
  userAuthToken: string,
  emailAccountId: number | string,
): Promise<NextResponse> {
  const apiKeyError = validateTalentApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }

  if (!userAuthToken) {
    return createBadRequestResponse("Missing user auth token");
  }
  if (emailAccountId === undefined || emailAccountId === null) {
    return createBadRequestResponse("Missing email account id");
  }

  try {
    const url = `${TALENT_API_BASE}/email_accounts/${encodeURIComponent(String(emailAccountId))}/disconnect`;
    const resp = await fetch(url, {
      method: "PUT",
      headers: {
        ...createTalentApiHeaders(process.env.TALENT_API_KEY || ""),
        Authorization: `Bearer ${userAuthToken}`,
      },
    });

    if (resp.status === 204) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      if (!resp.ok) {
        return NextResponse.json(data, { status: resp.status });
      }
      return NextResponse.json(data, { status: 200 });
    }

    const text = await resp.text();
    if (!resp.ok) {
      return NextResponse.json({ error: text || "Request failed" }, { status: resp.status });
    }
    return NextResponse.json({ ok: true, message: text }, { status: 200 });
  } catch (error) {
    logApiError(
      "disconnectEmailAccount",
      String(emailAccountId),
      error instanceof Error ? error.message : String(error),
    );
    return createServerErrorResponse("Failed to disconnect email account");
  }
}

export async function createTalentAuthToken(params: {
  address: string;
  signature: string;
  chain_id: number;
}): Promise<NextResponse> {
  const apiKeyError = validateTalentApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }

  try {
    const resp = await fetch(`${TALENT_API_BASE}/auth/create_auth_token`, {
      method: "POST",
      headers: {
        ...createTalentApiHeaders(process.env.TALENT_API_KEY || ""),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!validateJsonResponse(resp)) {
      throw new Error("Invalid response format from Talent API");
    }
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || `HTTP ${resp.status}: ${resp.statusText}`);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logApiError(
      "create_auth_token",
      params.address,
      error instanceof Error ? error.message : String(error),
    );
    return createServerErrorResponse("Failed to create auth token");
  }
}

// User nonce helper (requires end-user Authorization token)
export async function createUserNonceWithAuth(
  userAuthToken: string,
): Promise<NextResponse> {
  const apiKeyError = validateTalentApiKey();
  if (apiKeyError) {
    return createServerErrorResponse(apiKeyError);
  }

  if (!userAuthToken) {
    return createBadRequestResponse("Missing user auth token");
  }

  try {
    const resp = await fetch(`${TALENT_API_BASE}/user_nonces`, {
      method: "POST",
      headers: {
        ...createTalentApiHeaders(process.env.TALENT_API_KEY || ""),
        Authorization: `Bearer ${userAuthToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!validateJsonResponse(resp)) {
      throw new Error("Invalid response format from Talent API");
    }
    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(data, { status: resp.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logApiError(
      "create_user_nonce",
      "self",
      error instanceof Error ? error.message : String(error),
    );
    return createServerErrorResponse("Failed to create user nonce");
  }
}
