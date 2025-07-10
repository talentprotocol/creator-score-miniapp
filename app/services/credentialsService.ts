import { Credential, IssuerCredentialGroup, SCORER_SLUGS } from "./types";

/**
 * Fetches credentials for a Talent Protocol ID from the API
 * and groups them by issuer for display in the UI
 */
export async function getCredentialsForTalentId(
  talentId: string | number,
): Promise<IssuerCredentialGroup[]> {
  try {
    // Always use relative path to avoid CORS issues and ensure we use our API routes
    let baseUrl = "";
    if (typeof window !== "undefined") {
      // Client-side: use relative path to ensure we call our own API routes
      baseUrl = "";
    } else {
      // Server-side: use the current origin
      baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "";
    }
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
      scorer_slug: SCORER_SLUGS.CREATOR,
    });
    const url = `${baseUrl}/api/talent-credentials?${params.toString()}`;

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data.error) {
      return [];
    }

    if (!Array.isArray(data.credentials)) {
      return [];
    }

    // Group credentials by issuer
    const issuerGroups = new Map<string, IssuerCredentialGroup>();

    data.credentials.forEach((cred: Credential) => {
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
      let readableValue = null;
      let uom = null;

      if (cred.points_calculation_logic?.data_points) {
        const maxDataPoint = cred.points_calculation_logic.data_points.find(
          (dp) => dp.is_maximum,
        );
        readableValue = maxDataPoint?.readable_value ?? null;
        uom = maxDataPoint?.uom ?? cred.uom ?? null;
      } else {
        uom = cred.uom ?? null;
      }

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

    const result = Array.from(issuerGroups.values()).sort(
      (a, b) => b.total - a.total,
    );

    return result;
  } catch {
    return [];
  }
}
