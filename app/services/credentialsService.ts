import { Credential, IssuerCredentialGroup, SCORER_SLUGS } from "./types";

/**
 * Fetches credentials for a Talent Protocol ID from the API
 * and groups them by issuer for display in the UI
 */
export async function getCredentialsForTalentId(
  talentId: string | number,
): Promise<IssuerCredentialGroup[]> {
  try {
    let baseUrl = "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        baseUrl = ""; // relative path
      } else {
        baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      }
    } else {
      baseUrl = process.env.NEXT_PUBLIC_URL || "";
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
      if (cred.points === 0) {
        return;
      }

      // Move Kaito credential under X/Twitter and rename
      let issuer = cred.data_issuer_name;
      let name = cred.name;
      if (issuer.toLowerCase().includes("kaito")) {
        issuer = "X/Twitter";
        name = "Kaito Yaps Airdrop";
      }

      if (typeof issuer !== "string") {
        return;
      }

      const existingGroup = issuerGroups.get(issuer);
      const maxScore = cred.points_calculation_logic?.max_points ?? null;
      let pointsArr = [];

      // For each credential, log the raw data_points array
      // eslint-disable-next-line no-console
      console.log(
        "[CredentialService Debug] Credential:",
        cred.name,
        cred.points_calculation_logic?.data_points,
      );

      // If there are data points, use them for readable_value and uom
      if (
        cred.points_calculation_logic?.data_points &&
        cred.points_calculation_logic.data_points.length > 0
      ) {
        pointsArr = cred.points_calculation_logic.data_points.map((dp) => {
          // Debug log for the raw data point
          // eslint-disable-next-line no-console
          console.log("[CredentialService Debug] Raw data_point:", dp);
          const point = {
            label: name,
            value: cred.points, // points for progress bar
            max_score: maxScore,
            readable_value: dp.readable_value ?? dp.value ?? null, // clean value for display
            uom: dp.uom ?? cred.uom ?? null,
            external_url: cred.external_url,
          };
          // Debug log for each mapped point
          // eslint-disable-next-line no-console
          console.log("[CredentialService Debug] Mapped point:", point);
          return point;
        });
      } else {
        const point = {
          label: name,
          value: cred.points,
          max_score: maxScore,
          readable_value: null,
          uom: cred.uom ?? null,
          external_url: cred.external_url,
        };
        // eslint-disable-next-line no-console
        console.log("[Credential Debug] Point:", point);
        pointsArr = [point];
      }

      if (existingGroup) {
        existingGroup.total += cred.points;
        existingGroup.max_total =
          (existingGroup.max_total ?? 0) + (maxScore ?? 0);
        existingGroup.points.push(...pointsArr);
      } else {
        issuerGroups.set(issuer, {
          issuer,
          total: cred.points,
          max_total: maxScore ?? 0,
          points: pointsArr,
        });
      }
    });

    const result = Array.from(issuerGroups.values()).sort(
      (a, b) => b.total - a.total,
    );
    // eslint-disable-next-line no-console
    console.log("[Credential Debug] Final grouped result:", result);
    return result;
  } catch {
    return [];
  }
}
