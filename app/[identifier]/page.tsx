import { resolveTalentUser } from "@/lib/user-resolver";
import { redirect } from "next/navigation";
import { RESERVED_WORDS } from "@/lib/constants";
import { CreatorNotFoundCard } from "@/components/common/CreatorNotFoundCard";

export default async function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  if (RESERVED_WORDS.includes(params.identifier)) {
    return <CreatorNotFoundCard />;
  }

  // Resolve user
  const user = await resolveTalentUser(params.identifier);

  if (!user || !user.id) {
    return <CreatorNotFoundCard />;
  }

  // Determine canonical human-readable identifier: Farcaster, Wallet, else UUID
  const canonical = user.fname || user.wallet || user.id;

  if (
    canonical &&
    params.identifier !== canonical &&
    params.identifier !== undefined
  ) {
    redirect(`/${canonical}/stats`);
  }

  // Always redirect to stats tab by default
  redirect(`/${params.identifier}/stats`);
}
