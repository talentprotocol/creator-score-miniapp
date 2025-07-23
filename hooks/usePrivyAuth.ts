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

  useEffect(() => {
    console.log("talentUserId", talentUserId);
  }, [talentUserId]);

  const handleLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("talentUserId");
    }
    login({ walletChainType: "ethereum-only" });
  };

  const handleLogout = () => {
    console.log("handleLogout");
    if (typeof window !== "undefined") {
      console.log("removing talentUserId");
      localStorage.removeItem("talentUserId");
      setTalentUserId(null);
    }
    console.log("logging out");
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
        console.log("[FETCH REQUEST] INSIDE PRIVY");
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
  }, [authenticated]);

  return {
    ready,
    authenticated,
    privyUser,
    talentId: talentUserId,
    handleLogin,
    handleLogout,
  };
};
