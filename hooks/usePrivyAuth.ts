"use client";

import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const getInitialTalentUserId = () => {
  if (typeof window !== "undefined") {
    const id = localStorage.getItem("talentUserId");
    return id || null;
  }
  return null;
};

export const usePrivyAuth = ({
  onLoginComplete,
}: {
  onLoginComplete?: () => void;
}) => {
  const router = useRouter();
  const { ready, authenticated, user: privyUser, logout } = usePrivy();
  const { login } = useLogin({
    onComplete: () => {
      if (onLoginComplete) {
        onLoginComplete();
      }
    },
  });

  const [talentUserId, setTalentUserId] = useState<string | null>(
    getInitialTalentUserId(),
  );

  const handleLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("talentUserId");
    }
    login({ walletChainType: "ethereum-only" });
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("talentUserId");
      }
      setTalentUserId(null);
      router.push("/leaderboard");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    // Clear state when not authenticated
    if (!authenticated) {
      setTalentUserId(null);
      return;
    }

    async function getUserFromPrivy() {
      if (
        ready &&
        authenticated &&
        privyUser &&
        privyUser.wallet &&
        !talentUserId
      ) {
        try {
          const request = await fetch(
            `/api/talent-user?id=${privyUser.wallet.address}`,
          );
          const data = await request.json();
          if (typeof window !== "undefined") {
            localStorage.setItem("talentUserId", data.id);
          }
          setTalentUserId(data.id);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    }

    const id = getInitialTalentUserId();
    if (id) {
      setTalentUserId(id);
    } else {
      getUserFromPrivy();
    }
  }, [authenticated, ready, privyUser]);

  return {
    ready,
    authenticated,
    privyUser,
    talentId: talentUserId,
    handleLogin,
    handleLogout,
  };
};
