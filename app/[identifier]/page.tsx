import { redirect } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  // Always redirect to stats tab by default
  // User resolution and canonical redirects are handled by layout.tsx
  redirect(`/${params.identifier}/stats`);
}
