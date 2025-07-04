import { useState, useEffect } from "react";
import {
  getCredentialsForTalentId,
  IssuerCredentialGroup,
} from "@/app/services/talentService";
import { getEthUsdcPrice, convertEthToUsdc } from "@/lib/utils";

export function useProfileTotalEarnings(talentUUID: string) {
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!talentUUID) return;
    setLoading(true);
    Promise.all([getCredentialsForTalentId(talentUUID), getEthUsdcPrice()])
      .then(([credentials, ethPrice]) => {
        let total = 0;
        credentials.forEach((issuer: IssuerCredentialGroup) => {
          issuer.points.forEach((pt) => {
            if (pt.label === "ETH Balance") return;
            if (!pt.readable_value) return;
            const value = parseFloat(
              pt.readable_value.replace(/[^0-9.-]+/g, ""),
            );
            if (isNaN(value)) return;
            if (pt.uom === "ETH") {
              total += convertEthToUsdc(value, ethPrice);
            } else if (pt.uom === "USDC") {
              total += value;
            }
          });
        });
        setTotalEarnings(total);
        setLoading(false);
      })
      .catch(() => {
        setTotalEarnings(0);
        setLoading(false);
      });
  }, [talentUUID]);

  return { totalEarnings, loading };
}
