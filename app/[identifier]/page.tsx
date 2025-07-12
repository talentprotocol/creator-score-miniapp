import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { resolveTalentUser } from "@/lib/user-resolver";
import { redirect } from "next/navigation";
import { RESERVED_WORDS } from "@/lib/constants";

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

  // Determine canonical human-readable identifier: Farcaster, Wallet, else UUID
  const canonical = user.fname || user.wallet || user.id;

  if (
    canonical &&
    params.identifier !== canonical &&
    params.identifier !== undefined
  ) {
    redirect(`/${canonical}`);
  }

  return <ProfileScreen talentUUID={user.id} />;
}
