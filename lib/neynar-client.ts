import { NextResponse } from "next/server";
import {
  validateNeynarApiKey,
  createServerErrorResponse,
  createBadRequestResponse,
  createNotFoundResponse,
  withRetry,
  logApiError,
} from "./api-utils";

// Type definition for the Neynar client
interface NeynarClientType {
  fetchBulkUsers: (params: { fids: number[] }) => Promise<{
    users: Array<{
      fid: number;
      verifications: string[];
      custody_address: string;
      verified_addresses: {
        primary: {
          eth_address: string | null;
          sol_address: string | null;
        };
      };
    }>;
  }>;
}

// Dynamic import function for Neynar SDK
async function createNeynarClient(apiKey: string): Promise<NeynarClientType> {
  if (typeof window !== "undefined") {
    throw new Error("NeynarClient can only be used server-side");
  }

  const { NeynarAPIClient } = await import("@neynar/nodejs-sdk");
  return new NeynarAPIClient({ apiKey });
}

export interface WalletAddressesResponse {
  addresses: string[];
  custodyAddress?: string;
  primaryEthAddress: string | null;
  primarySolAddress: string | null;
}

export interface NeynarClientOptions {
  apiKey?: string;
  enableRetry?: boolean;
  maxRetryAttempts?: number;
}

export class NeynarClient {
  private client: NeynarClientType | null = null;
  private apiKey: string;
  private enableRetry: boolean;
  private maxRetryAttempts: number;

  constructor(options: NeynarClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.NEYNAR_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("Neynar API key is required");
    }

    if (typeof window !== "undefined") {
      throw new Error("NeynarClient can only be used server-side");
    }

    this.enableRetry = options.enableRetry ?? true;
    this.maxRetryAttempts = options.maxRetryAttempts ?? 2;
  }

  private async getClient(): Promise<NeynarClientType> {
    if (!this.client) {
      this.client = await createNeynarClient(this.apiKey);
    }
    return this.client;
  }

  private async fetchUserData(fid: number): Promise<{
    users: Array<{
      fid: number;
      verifications: string[];
      custody_address: string;
      verified_addresses: {
        primary: {
          eth_address: string | null;
          sol_address: string | null;
        };
      };
    }>;
  }> {
    const client = await this.getClient();

    if (this.enableRetry) {
      return withRetry(
        () => client.fetchBulkUsers({ fids: [fid] }),
        this.maxRetryAttempts,
      );
    }

    return client.fetchBulkUsers({ fids: [fid] });
  }

  async getWalletAddresses(params: {
    fid?: string;
    wallet?: string;
  }): Promise<NextResponse> {
    const apiKeyError = validateNeynarApiKey();
    if (apiKeyError) {
      return createServerErrorResponse(apiKeyError);
    }

    const { fid, wallet } = params;

    if (!fid && !wallet) {
      return createBadRequestResponse("FID or wallet is required");
    }

    // Handle FID lookup
    if (fid) {
      try {
        const user = await this.fetchUserData(Number(fid));

        if (!user?.users?.[0]) {
          return createNotFoundResponse("User not found");
        }

        const userData = user.users[0];
        const addresses = userData.verifications || [];
        const primaryEthAddress =
          userData.verified_addresses?.primary?.eth_address || null;
        const primarySolAddress =
          userData.verified_addresses?.primary?.sol_address || null;

        const response: WalletAddressesResponse = {
          addresses,
          custodyAddress: userData.custody_address,
          primaryEthAddress,
          primarySolAddress,
        };

        return NextResponse.json(response);
      } catch (error) {
        logApiError(
          "getWalletAddresses",
          `fid:${fid}`,
          error instanceof Error ? error.message : String(error),
        );
        return createServerErrorResponse("Failed to fetch user data");
      }
    }

    // Handle wallet lookup (fallback/mock for now)
    if (wallet) {
      // In a real implementation, you would look up wallet verifications here
      // For now, just return the wallet as the only address
      const response: WalletAddressesResponse = {
        addresses: [wallet],
        primaryEthAddress: wallet,
        primarySolAddress: null,
      };

      return NextResponse.json(response);
    }

    return createBadRequestResponse("Invalid request parameters");
  }

  // Helper method for services that need raw wallet data
  async getWalletAddressesRaw(fid: number): Promise<WalletAddressesResponse> {
    try {
      const user = await this.fetchUserData(fid);

      if (!user?.users?.[0]) {
        return {
          addresses: [],
          custodyAddress: "",
          primaryEthAddress: null,
          primarySolAddress: null,
        };
      }

      const userData = user.users[0];
      return {
        addresses: userData.verifications || [],
        custodyAddress: userData.custody_address || "",
        primaryEthAddress:
          userData.verified_addresses?.primary?.eth_address || null,
        primarySolAddress:
          userData.verified_addresses?.primary?.sol_address || null,
      };
    } catch (error) {
      logApiError(
        "getWalletAddressesRaw",
        `fid:${fid}`,
        error instanceof Error ? error.message : String(error),
      );
      return {
        addresses: [],
        custodyAddress: "",
        primaryEthAddress: null,
        primarySolAddress: null,
      };
    }
  }
}

// Lazy instance creation to avoid client-side instantiation
let _neynarClient: NeynarClient | null = null;

export function getNeynarClient(): NeynarClient {
  if (typeof window !== "undefined") {
    throw new Error("NeynarClient can only be used server-side");
  }

  if (!_neynarClient) {
    _neynarClient = new NeynarClient();
  }

  return _neynarClient;
}
