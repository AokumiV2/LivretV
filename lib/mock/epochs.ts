import { Epoch } from "@/lib/types";
import { fakeHash } from "@/lib/utils/format";

const mk = (farmId: string, period: string, amount: number, status: Epoch["status"]): Epoch => ({
  id: `${farmId}-${period}`,
  farmId,
  periodLabel: period,
  totalRevenueUSD: amount,
  timestamp: `${period}-28T12:00:00.000Z`,
  proofHash: fakeHash(),
  status
});

export const epochs: Epoch[] = [
  mk("farm-solar-fr", "2025-12", 42000, "FUNDED"),
  mk("farm-solar-fr", "2026-01", 46800, "CLAIMABLE"),
  mk("farm-solar-es", "2025-12", 51000, "FUNDED"),
  mk("farm-solar-es", "2026-01", 54900, "CLAIMABLE"),
  mk("farm-wind-de", "2025-12", 79000, "FUNDED"),
  mk("farm-wind-de", "2026-01", 82100, "CLAIMABLE"),
  mk("farm-wind-dk", "2025-12", 62000, "FUNDED"),
  mk("farm-wind-dk", "2026-01", 58000, "CLAIMABLE"),
  mk("farm-hydro-no", "2025-12", 77000, "FUNDED"),
  mk("farm-hydro-no", "2026-01", 80100, "CLAIMABLE"),
  mk("farm-hydro-ch", "2025-12", 12000, "ANNOUNCED"),
  mk("farm-hydro-ch", "2026-01", 14500, "FUNDED")
];
