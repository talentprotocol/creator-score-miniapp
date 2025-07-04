import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { resolveTalentUser } from "@/lib/user-resolver";
import { redirect } from "next/navigation";

// List of reserved words that cannot be used as profile identifiers
const RESERVED_WORDS = [
  "api",
  "settings",
  "leaderboard",
  "profile",
  "services",
  ".well-known",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  // Recommended additions
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "auth",
  "admin",
  "dashboard",
  "home",
  "explore",
  "notifications",
  "messages",
  "search",
  "help",
  "support",
  "terms",
  "privacy",
  "about",
  "contact",
  "static",
  "public",
  "assets",
  // Add more as needed
];

export default async function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  if (RESERVED_WORDS.includes(params.identifier)) {
    return null;
  }
  // Show loading spinner while resolving user
  const userPromise = resolveTalentUser(params.identifier);
  const user = await userPromise;
  if (!user || !user.id) {
    return (
      <div className="p-8 text-center text-destructive">User not found</div>
    );
  }
  // Determine canonical human-readable identifier: Farcaster, then Github, else UUID
  const canonical = user.fname || user.github || user.id;
  if (
    canonical &&
    params.identifier !== canonical &&
    params.identifier !== undefined
  ) {
    redirect(`/${canonical}`);
  }
  return <ProfileScreen talentUUID={user.id} />;
}
