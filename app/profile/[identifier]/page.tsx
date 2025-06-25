import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { resolveTalentUser } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  // Try to resolve by Farcaster, then Github, then UUID
  const user = await resolveTalentUser(params.identifier);
  if (!user) {
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
    redirect(`/profile/${canonical}`);
  }
  return (
    <ProfileScreen
      // Always use UUID for internal lookups
      {...(user.id ? { uuid: user.id } : {})}
      {...(user.fid != null ? { fid: user.fid } : {})}
      {...(user.wallet ? { wallet: user.wallet } : {})}
      {...(user.github ? { github: user.github } : {})}
    />
  );
}
