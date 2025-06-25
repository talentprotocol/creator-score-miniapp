import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/user-context";
import { resolveTalentUser } from "@/lib/user-resolver";

export default async function ProfilePage() {
  // Get the current user context (server-side, so no Farcaster context)
  // For now, use DEV_USER fallback for development
  const user = getUserContext(null);
  if (!user) {
    return <div className="p-8 text-center">Not authenticated</div>;
  }
  // Resolve the canonical identifier (fname, github, or UUID)
  const resolved = await resolveTalentUser(user.username || String(user.fid));
  const canonical = resolved?.fname || resolved?.github || resolved?.id;
  if (canonical) {
    redirect(`/${canonical}`);
  }
  return <div className="p-8 text-center">Profile not found</div>;
}
