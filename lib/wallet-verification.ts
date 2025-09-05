import { talentApiClient } from "./talent-api-client";
import { dlog, dtimer } from "./debug";

/**
 * Verify that a wallet address belongs to a specific user
 *
 * @param talentUuid - The user's Talent Protocol UUID
 * @param walletAddress - The wallet address to verify
 * @returns Promise<boolean> - True if the wallet belongs to the user, false otherwise
 */
export async function verifyWalletOwnership(
  talentUuid: string,
  walletAddress: string,
): Promise<boolean> {
  const verificationTimer = dtimer(
    "WalletVerification",
    "verifyWalletOwnership",
  );

  dlog("WalletVerification", "verifyWalletOwnership_start", {
    talentUuid,
    walletAddress,
    walletAddressLength: walletAddress.length,
  });

  try {
    // Fetch user profile from Talent Protocol API
    const response = await talentApiClient.getProfile({
      talent_protocol_id: talentUuid,
    });

    if (!response.ok) {
      dlog("WalletVerification", "verifyWalletOwnership_user_not_found", {
        talentUuid,
        status: response.status,
      });
      verificationTimer.end();
      return false;
    }

    const userData = await response.json();

    dlog("WalletVerification", "verifyWalletOwnership_user_data", {
      talentUuid,
      hasUserData: !!userData,
      userWallets: [
        userData.wallet,
        userData.main_wallet_address,
        userData.farcaster_primary_wallet_address,
      ].filter(Boolean),
    });

    // Extract all wallet addresses from the user data
    const userWallets = [
      userData.wallet,
      userData.main_wallet_address,
      userData.farcaster_primary_wallet_address,
    ].filter(Boolean); // Remove null/undefined values

    // Check if the provided wallet address matches any of the user's wallets
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const isWalletOwned = userWallets.some(
      (userWallet) => userWallet.toLowerCase() === normalizedWalletAddress,
    );

    dlog("WalletVerification", "verifyWalletOwnership_result", {
      talentUuid,
      walletAddress,
      userWallets,
      isWalletOwned,
    });

    verificationTimer.end();
    return isWalletOwned;
  } catch (error) {
    dlog("WalletVerification", "verifyWalletOwnership_error", {
      talentUuid,
      walletAddress,
      error: error instanceof Error ? error.message : String(error),
    });

    verificationTimer.end();
    return false;
  }
}

