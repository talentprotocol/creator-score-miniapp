"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { isFarcasterMiniAppSync } from "@/lib/utils";

// Minimal typings to avoid 'any' while interoperating with the SDK
type Eip1193RequestArgs = { method: string; params?: unknown[] };
export type Eip1193Provider = {
  request: (args: Eip1193RequestArgs) => Promise<unknown>;
};

type MiniAppSdkWallet = {
  getEthereumProvider?: () => Promise<Eip1193Provider | null | undefined>;
  ethProvider?: Eip1193Provider | null;
  signMessage?: (args: { message: string }) => Promise<{ signature: string } | string>;
  connect?: () => Promise<unknown>;
  list?: () => Promise<{ wallets?: Array<{ address?: string; chainId?: number }>; primaryWallet?: { address?: string; chainId?: number } | null } | { items?: Array<{ address?: string; chainId?: number; ethAddress?: string; walletAddress?: string; network?: { chainId?: number } }>; primary?: { address?: string; chainId?: number; ethAddress?: string; walletAddress?: string; network?: { chainId?: number } } }>;
};

type MiniAppSdkWallets = {
  connect?: () => Promise<unknown>;
  list?: () => Promise<unknown>;
  signMessage?: (args: { message: string }) => Promise<{ signature: string } | string>;
};

type MiniAppSdk = {
  isInMiniApp: () => Promise<boolean>;
  wallet?: MiniAppSdkWallet;
  wallets?: MiniAppSdkWallets;
};

const miniSdk: MiniAppSdk = sdk as unknown as MiniAppSdk;

export async function isFarcasterMiniApp(timeoutMs: number = 100): Promise<boolean> {
  try {
    const detectionPromise = miniSdk.isInMiniApp();
    const timeoutPromise = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), Math.max(0, timeoutMs)),
    );
    const result = await Promise.race([detectionPromise, timeoutPromise]);
    return result === true;
  } catch {
    return isFarcasterMiniAppSync();
  }
}

export async function getFarcasterEthereumProvider(): Promise<Eip1193Provider | null> {
  try {
    const viaGetter = miniSdk.wallet?.getEthereumProvider
      ? await miniSdk.wallet.getEthereumProvider()
      : undefined;
    const viaLegacy = miniSdk.wallet?.ethProvider;
    return viaGetter || viaLegacy || null;
  } catch {
    return null;
  }
}

export async function signMessageInMiniApp(message: string): Promise<string | null> {
  try {
    if (miniSdk.wallets?.signMessage) {
      const res = await miniSdk.wallets.signMessage({ message });
      if (typeof res === "string") return res;
      if (res && typeof res === "object" && typeof (res as { signature?: unknown }).signature === "string") {
        return (res as { signature: string }).signature;
      }
    }
    if (miniSdk.wallet?.signMessage) {
      const res = await miniSdk.wallet.signMessage({ message });
      if (typeof res === "string") return res;
      if (res && typeof res === "object" && typeof (res as { signature?: unknown }).signature === "string") {
        return (res as { signature: string }).signature;
      }
    }
  } catch {}
  try {
    type FarcasterWalletWindow = Window & {
      farcasterWallet?: { signMessage?: (msg: string) => Promise<string> };
    };
    const w = window as FarcasterWalletWindow;
    if (w?.farcasterWallet?.signMessage) {
      return await w.farcasterWallet.signMessage(message);
    }
  } catch {}
  return null;
}

export async function connectWalletInMiniApp(): Promise<boolean> {
  try {
    if (miniSdk.wallets?.connect) {
      await miniSdk.wallets.connect();
      return true;
    }
    if (miniSdk.wallet?.connect) {
      await miniSdk.wallet.connect();
      return true;
    }
  } catch {}
  return false;
}

export async function listWalletsInMiniApp(): Promise<{ wallets?: Array<{ address?: string; chainId?: number }>; primaryWallet?: { address?: string; chainId?: number } | null } | null> {
  try {
    if (miniSdk.wallet?.list) {
      const raw = await miniSdk.wallet.list();
      const normalize = (w: unknown): { address?: string; chainId?: number } => {
        const obj = (w as Record<string, unknown>) || {};
        const address = (obj.address as string) || (obj.ethAddress as string) || (obj.walletAddress as string) || undefined;
        const chainId = (obj.chainId as number) || ((obj.network as Record<string, unknown> | undefined)?.chainId as number) || undefined;
        return { address, chainId };
      };
      const r = (raw as Record<string, unknown>) || {};
      const walletsRaw = (r.wallets as unknown[]) || (r.items as unknown[]) || [];
      const primaryRaw = (r.primaryWallet as unknown) || (r.primary as unknown) || null;
      return {
        wallets: Array.isArray(walletsRaw) ? walletsRaw.map(normalize) : [],
        primaryWallet: primaryRaw ? normalize(primaryRaw) : null,
      };
    }
  } catch {}
  return null;
}


