import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { resolveTalentUser } from "@/lib/user-resolver";
import { redirect } from "next/navigation";
import { RESERVED_WORDS } from "@/lib/constants";

export default async function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  console.log(
    "[PublicProfilePage] Starting with identifier:",
    params.identifier,
  );

  if (RESERVED_WORDS.includes(params.identifier)) {
    console.log(
      "[PublicProfilePage] Identifier is reserved word, returning null",
    );
    return null;
  }

  // Show loading spinner while resolving user
  console.log(
    "[PublicProfilePage] Resolving user for identifier:",
    params.identifier,
  );
  const userPromise = resolveTalentUser(params.identifier);
  const user = await userPromise;

  console.log("[PublicProfilePage] User resolution result:", user);

  if (!user || !user.id) {
    console.log("[PublicProfilePage] User not found or no ID, showing error");
    return (
      <div className="p-8 text-center text-destructive">User not found</div>
    );
  }

  // Determine canonical human-readable identifier: Farcaster, Wallet, else UUID
  const canonical = user.fname || user.wallet || user.id;
  console.log("[PublicProfilePage] Canonical identifier:", canonical);
  console.log(
    "[PublicProfilePage] Current params.identifier:",
    params.identifier,
  );

  if (
    canonical &&
    params.identifier !== canonical &&
    params.identifier !== undefined
  ) {
    console.log("[PublicProfilePage] Redirecting to canonical:", canonical);
    redirect(`/${canonical}`);
  }

  console.log(
    "[PublicProfilePage] Rendering ProfileScreen with talentUUID:",
    user.id,
  );
  return <ProfileScreen talentUUID={user.id} />;
}
