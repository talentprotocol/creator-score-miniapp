import { resolveTalentUser } from "@/lib/user-resolver";
import { redirect } from "next/navigation";
import { RESERVED_WORDS } from "@/lib/constants";
import { CreatorNotFoundCard } from "@/components/common/CreatorNotFoundCard";
import { ProfileLayoutContent } from "./ProfileLayoutContent";

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
    // Preserve the current path when redirecting to canonical
    const currentPath = params.identifier;
    if (currentPath.includes("/")) {
      const pathParts = currentPath.split("/");
      const tabPart = pathParts[pathParts.length - 1];
      redirect(`/${canonical}/${tabPart}`);
    } else {
      redirect(`/${canonical}/stats`);
    }
  }

  return (
    <ProfileLayoutContent talentUUID={user.id} identifier={canonical}>
      {children}
    </ProfileLayoutContent>
  );
}
