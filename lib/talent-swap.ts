import { detectClient, openExternalUrl } from "@/lib/utils";

// TALENT token CAIP-19 asset ID on Base chain
const TALENT_TOKEN_CAIP19 =
  "eip155:8453/erc20:0x9a33406165f562e16c3abd82fd1185482e01b49a";

// Swap states for user feedback
export type SwapState = "idle" | "loading" | "success" | "error" | "rejected";

export interface SwapResult {
  state: SwapState;
  message?: string;
  transactions?: string[];
}

/**
 * Handle token swap with Farcaster native swap or fallback to Aerodrome
 */
export async function handleGetTalent(
  fallbackUrl: string,
  onStateChange: (result: SwapResult) => void,
): Promise<void> {
  const client = await detectClient();

  // Try Farcaster native swap first
  if (client === "farcaster" || client === "base") {
    try {
      onStateChange({ state: "loading" });

      const { sdk } = await import("@farcaster/miniapp-sdk");

      const result = await sdk.actions.swapToken({
        buyToken: TALENT_TOKEN_CAIP19,
        // sellToken and sellAmount are optional - user can choose what to sell
      });

      if (result.success) {
        onStateChange({
          state: "success",
          message: `${result.swap.transactions.length} transaction(s) executed.`,
          transactions: result.swap.transactions,
        });
      } else {
        const errorMessage =
          result.reason === "rejected_by_user"
            ? "Swap was cancelled by user"
            : `Swap failed: ${result.error?.message || "Unknown error"}`;

        onStateChange({
          state: result.reason === "rejected_by_user" ? "rejected" : "error",
          message: errorMessage,
        });
      }

      return; // Don't fall through to external URL
    } catch (error) {
      console.warn("Native swap failed, falling back to Aerodrome:", error);
      onStateChange({
        state: "error",
        message: "Native swap unavailable, redirecting to Aerodrome...",
      });

      // Small delay to show the message before redirect
      setTimeout(async () => {
        await openExternalUrl(fallbackUrl, null, client);
      }, 1500);
      return;
    }
  }

  // Fallback to external Aerodrome URL for non-Farcaster environments
  await openExternalUrl(fallbackUrl, null, client);
}

// Default Aerodrome URL for TALENT token
export const DEFAULT_TALENT_SWAP_URL =
  "https://aerodrome.finance/swap?from=eth&to=0x9a33406165f562e16c3abd82fd1185482e01b49a&chain0=8453&chain1=8453";
