import { redirect } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  // Always redirect to stats tab by default
  // Layout already handles user resolution and canonical redirects
  redirect(`/${params.identifier}/stats`);
}
