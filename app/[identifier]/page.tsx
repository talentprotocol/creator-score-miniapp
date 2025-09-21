import { redirect } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  // Don't redirect if the identifier is a Talent UUID (already canonical)
  const isTalentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.identifier);
  
  if (!isTalentUuid) {
    // Only redirect to stats tab for non-UUID identifiers
    // Layout already handles user resolution and canonical redirects
    redirect(`/${params.identifier}/stats`);
  }
  
  // For UUID identifiers, let the layout handle the display without redirecting
  return null;
}
