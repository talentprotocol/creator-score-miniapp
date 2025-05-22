"use client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserWalletAddresses } from "../services/neynarService";

const placeholderAvatar =
  "https://api.dicebear.com/7.x/identicon/svg?seed=profile";

export default function BuilderHome() {
  const { context, setFrameReady, isFrameReady } = useMiniKit();
  const user = context?.user;
  const handle = user?.username || "Unknown user";
  const displayName = user?.displayName || handle;
  const pfpUrl = user?.pfpUrl || placeholderAvatar;
  const [walletAddresses, setWalletAddresses] = useState<string[]>([]);
  const [walletError, setWalletError] = useState<string | undefined>();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    async function fetchWalletAddresses() {
      if (user?.fid) {
        const { addresses, error } = await getUserWalletAddresses(user.fid);
        setWalletAddresses(addresses);
        setWalletError(error);
      }
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
          style={{
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: 1,
            color: "#888",
            marginBottom: 16,
          }}
        >
          Builder Score
        </div>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 24 }}
        >
          <img
            src={pfpUrl}
            alt="Profile picture"
            style={{
              width: 64,
              height: 64,
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

        {/* Wallet Addresses Section */}
        <div style={{ width: "100%", marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Connected Wallets
          </h3>
          {walletError ? (
            <div style={{ color: "#dc2626", fontSize: 14 }}>{walletError}</div>
          ) : walletAddresses.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {walletAddresses.map((address) => (
                <div
                  key={address}
                  style={{
                    padding: 12,
                    background: "#f5f7fa",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {address}
                </div>
              ))}
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
