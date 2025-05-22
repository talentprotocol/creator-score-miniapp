"use client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Link from "next/link";

const placeholderAvatar =
  "https://api.dicebear.com/7.x/identicon/svg?seed=profile";

export default function BuilderHome() {
  const { context } = useMiniKit();
  const user = context?.user;
  const handle = user?.username || "Unknown user";
  const displayName = user?.displayName || handle;
  const pfpUrl = user?.pfpUrl || placeholderAvatar;

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
