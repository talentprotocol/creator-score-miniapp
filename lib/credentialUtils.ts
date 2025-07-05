import { type IssuerCredentialGroup } from "@/app/services/types";

export function mergeCredentialsWithComingSoon(
  credentials: IssuerCredentialGroup[],
  comingSoonCredentials: IssuerCredentialGroup[],
): IssuerCredentialGroup[] {
  // Filter out coming soon credentials if they already exist in the API response (by slug)
  const apiCredentialSlugs = new Set(
    credentials.flatMap((c) => c.points.map((pt) => pt.slug).filter(Boolean)),
  );

  const filteredComingSoon = comingSoonCredentials
    .map((issuer) => ({
      ...issuer,
      points: issuer.points.filter(
        (pt) => !pt.slug || !apiCredentialSlugs.has(pt.slug),
      ),
    }))
    .filter((issuer) => issuer.points.length > 0);

  // Merge real credentials with coming soon ones, combining data points for existing issuers
  const existingIssuers = new Map(credentials.map((c) => [c.issuer, c]));
  const comingSoonMap = new Map(filteredComingSoon.map((c) => [c.issuer, c]));

  // Combine existing and coming soon credentials
  const allCredentials = Array.from(
    new Set([
      ...credentials.map((c) => c.issuer),
      ...filteredComingSoon.map((c) => c.issuer),
    ]),
  )
    .map((issuer) => {
      const existing = existingIssuers.get(issuer);
      const comingSoon = comingSoonMap.get(issuer);

      if (existing && comingSoon) {
        // Merge points: real credentials first, then coming soon points not already present
        const realLabels = new Set(existing.points.map((pt) => pt.label));
        const mergedPoints = [
          ...existing.points,
          ...comingSoon.points.filter((pt) => !realLabels.has(pt.label)),
        ];

        return {
          ...existing,
          points: mergedPoints,
        };
      }

      return existing || comingSoon;
    })
    .filter((issuer): issuer is IssuerCredentialGroup => issuer !== undefined);

  return allCredentials;
}

export function sortCredentialsByTotal(
  credentials: IssuerCredentialGroup[],
): IssuerCredentialGroup[] {
  return [
    ...credentials.filter((c) => c.total > 0),
    ...credentials
      .filter((c) => c.total === 0)
      .sort((a, b) => a.issuer.localeCompare(b.issuer)),
  ];
}
