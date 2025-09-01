import { redirect } from "next/navigation";
import { getTalentUserService } from "@/app/services/userService";

export default async function OptoutSharePage({
  params,
}: {
  params: { identifier: string };
}) {
  // Resolve user to get the canonical identifier
  const user = await getTalentUserService(params.identifier);

  if (!user || !user.id) {
    redirect("/");
  }

  // Determine canonical identifier and redirect to the main profile
  const canonical = user.fname || user.wallet || user.id;

  if (canonical !== params.identifier) {
    redirect(`/${canonical}/share/optout`);
  }

  // This page is just for metadata generation
  // Redirect to the main profile page
  redirect(`/${canonical}`);
}
