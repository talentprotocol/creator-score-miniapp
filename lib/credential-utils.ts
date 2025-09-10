import type { Credential, IssuerCredentialGroup } from "@/lib/types/credentials";

/**
 * Groups credentials by issuer and applies custom mappings
 * Shared logic between server service and client hook
 */
export function groupCredentialsByIssuer(credentials: Credential[]): IssuerCredentialGroup[] {
  if (!Array.isArray(credentials)) {
    return [];
  }

  // Group credentials by issuer
  const issuerGroups = new Map<string, IssuerCredentialGroup>();

  credentials.forEach((cred) => {
    // Move Kaito credential under X/Twitter and rename
    // Move Bonsai credential under Lens and rename
    let issuer = cred.data_issuer_name;
    let name = cred.name;
    if (issuer.toLowerCase().includes("kaito")) {
      issuer = "X/Twitter";
      name = "Kaito Yaps Airdrop";
    }
    if (issuer.toLowerCase().includes("bonsai")) {
      issuer = "Lens";
      name = "Bonsai Airdrop #1";
    }

    if (typeof issuer !== "string") {
      return;
    }

    const existingGroup = issuerGroups.get(issuer);
    // Always use credential-level values; ignore data_points
    const readableValue = cred.readable_value ?? null;
    const uom = cred.uom ?? null;

    const maxScore = cred.max_score; // Use max_score from API directly
    if (existingGroup) {
      existingGroup.total += cred.points;
      existingGroup.max_total =
        (existingGroup.max_total ?? 0) + (maxScore ?? 0);
      existingGroup.points.push({
        label: name,
        slug: cred.slug,
        value: cred.points,
        max_score: maxScore,
        readable_value: readableValue,
        uom: uom,
        external_url: cred.external_url,
      });
    } else {
      issuerGroups.set(issuer, {
        issuer,
        total: cred.points,
        max_total: maxScore ?? 0,
        points: [
          {
            label: name,
            slug: cred.slug,
            value: cred.points,
            max_score: maxScore,
            readable_value: readableValue,
            uom: uom,
            external_url: cred.external_url,
          },
        ],
      });
    }
  });

  // Sort by total points (highest first)
  const result = Array.from(issuerGroups.values()).sort(
    (a, b) => b.total - a.total,
  );

  return result;
}
