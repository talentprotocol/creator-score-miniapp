import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { resolveTalentUser } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  const user = await resolveTalentUser(params.identifier);
  if (!user) {
    return (
      <div className="p-8 text-center text-destructive">User not found</div>
    );
  }
  // Determine canonical identifier: Farcaster name (fname), then wallet, then UUID
  const canonical = user.fname || user.wallet || user.fid?.toString();
  if (canonical && params.identifier !== canonical) {
    redirect(`/profile/${canonical}`);
  }
  return (
    <ProfileScreen
      {...(user.fid != null ? { fid: user.fid } : {})}
      {...(user.wallet ? { wallet: user.wallet } : {})}
      {...(user.github ? { github: user.github } : {})}
    />
  );
}
