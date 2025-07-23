"use client";

import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const getInitialTalentUserId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("talentUserId") || null;
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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("talentUserId");
    }
    logout();
    router.push("/leaderboard");
  };

  useEffect(() => {
    async function getUserFromPrivy() {
      if (
        ready &&
        authenticated &&
        privyUser &&
        privyUser.wallet &&
        !talentUserId
      ) {
        const request = await fetch(
          `/api/talent-user?id=${privyUser.wallet.address}`,
        );
        const data = await request.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("talentUserId", data.id);
        }
        setTalentUserId(data.id);
      }
    }

    const id = getInitialTalentUserId();
    if (id) {
      setTalentUserId(id);
    } else {
      getUserFromPrivy();
    }
  }, [ready, authenticated, privyUser, talentUserId]);

  return {
    ready,
    authenticated,
    privyUser,
    talentId: talentUserId,
    handleLogin,
    handleLogout,
  };
};
