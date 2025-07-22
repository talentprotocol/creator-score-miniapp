"use client";

import React, { createContext, useContext, ReactNode } from "react";

// Profile data interface matching the server-side resolver
export interface ProfileData {
  id: string | null;
  fid: number | null;
  wallet: string | null;
  github: string | null;
  fname: string | null;
  display_name: string | null;
  image_url: string | null;
  bio?: string;
  [key: string]: unknown;
}

// Server-fetched profile data interface
export interface ServerProfileData {
  creatorScore: number | undefined;
  lastCalculatedAt: string | null;
  calculating: boolean;
  socialAccounts: unknown[];
  totalEarnings: number | undefined;
  posts: unknown[];
  yearlyData: { year: number; months: number[]; total: number }[];
  credentials: unknown[];
  earningsBreakdown: { totalEarnings: number; segments: unknown[] };
}

interface ProfileContextType {
  profile: ProfileData | null;
  talentUUID: string | null;
  identifier: string | null;
  profileData: ServerProfileData;
  // Refetch functions (for actions like refresh score)
  refetchScore: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
  profile: ProfileData | null;
  talentUUID: string | null;
  identifier: string | null;
  profileData: ServerProfileData;
}

export function ProfileProvider({
  children,
  profile,
  talentUUID,
  identifier,
  profileData,
}: ProfileProviderProps) {
  // Simple refetch placeholder - could trigger server refresh in the future
  const refetchScore = () => {
    // For now, just a placeholder
    // In a real implementation, this could trigger a server action or router.refresh()
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        talentUUID,
        identifier,
        profileData,
        refetchScore,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
}
