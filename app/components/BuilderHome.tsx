"use client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getUserWalletAddresses,
  type UserWalletAddresses,
} from "../services/neynarService";
import { BuilderScore, CreatorScore } from "./BuilderScore";

const placeholderAvatar =
  "https://api.dicebear.com/7.x/identicon/svg?seed=profile";

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CopyButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
      style={{
        marginLeft: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: copied ? "#22c55e" : "#888",
        fontSize: 16,
      }}
      title="Copy address"
    >
      {copied ? "✓" : "📋"}
    </button>
  );
}

export default function BuilderHome() {
  const { context, setFrameReady, isFrameReady } = useMiniKit();
  const user = context?.user;
  const handle = user?.username || "Unknown user";
  const displayName = user?.displayName || handle;
  const pfpUrl = user?.pfpUrl || placeholderAvatar;
  const [walletAddresses, setWalletAddresses] = useState<UserWalletAddresses>({
    addresses: [],
    custodyAddress: "",
    primaryEthAddress: null,
    primarySolAddress: null,
  });
  const [walletError, setWalletError] = useState<string | undefined>();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    async function fetchWalletAddresses() {
      if (!user?.fid) return;
      const data = await getUserWalletAddresses(user.fid);
      setWalletAddresses(data);
      setWalletError(data.error);
    }
    fetchWalletAddresses();
  }, [user?.fid]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#222",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: 700,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "32px 24px 0 24px",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 24 }}
        >
          <img
            src={pfpUrl}
            alt="Profile picture"
            width={64}
            height={64}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              marginRight: 20,
              border: "1px solid #eee",
              background: "#f5f5f5",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>
              {displayName}
            </span>
            <span style={{ fontSize: 14, color: "#666" }}>@{handle}</span>
          </div>
        </div>

        {/* Builder Score Section */}
        <div style={{ width: "100%", marginBottom: 32 }}>
          <BuilderScore fid={user?.fid} />
        </div>
        <div style={{ width: "100%", marginBottom: 32 }}>
          <CreatorScore fid={user?.fid} />
        </div>

        {/* Wallet Addresses Section */}
        <div style={{ width: "100%", marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Connected Wallets
          </h3>
          {walletError ? (
            <div style={{ color: "#dc2626", fontSize: 14 }}>{walletError}</div>
          ) : walletAddresses.addresses.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {walletAddresses.addresses.map((address: string) => {
                const isPrimaryEth =
                  address === walletAddresses.primaryEthAddress;
                const isPrimarySol =
                  address === walletAddresses.primarySolAddress;
                const isPrimary = isPrimaryEth || isPrimarySol;
                const chainType = isPrimaryEth
                  ? "ETH"
                  : isPrimarySol
                    ? "SOL"
                    : "ETH";

                return (
                  <div
                    key={address}
                    style={{
                      padding: 12,
                      background: "#f5f7fa",
                      borderRadius: 8,
                      fontSize: 14,
                      fontFamily: "monospace",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {truncateAddress(address)}
                      <CopyButton address={address} />
                    </span>
                    {isPrimary && (
                      <span
                        style={{
                          background: "#0052FF",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        Primary {chainType}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "#666", fontSize: 14 }}>
              No wallet addresses found
            </div>
          )}
        </div>
      </main>
      <footer style={{ padding: 16, marginTop: "auto" }}>
        <Link
          href="/demo"
          style={{
            fontSize: 13,
            color: "#0052FF",
            textDecoration: "underline",
            padding: 8,
            borderRadius: 6,
            background: "#f5f7fa",
          }}
        >
          Go to Demo App
        </Link>
      </footer>
    </div>
  );
}
