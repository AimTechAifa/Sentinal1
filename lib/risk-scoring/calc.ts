import { prisma } from "@/lib/prisma";
import { RISK_FACTOR_DEFS } from "./factors";
import { getWeightedRiskLevel } from "./weighted-level";

const bandRuleByFactorName = new Map(RISK_FACTOR_DEFS.map((f) => [f.factorName, f.bandRule]));

/**
 * Recomputes and persists the Weighted Risk Score for a single release.
 *
 * Pulls all ReleaseRiskFactorInput rows for the release, converts each
 * rawValue to a bandScore (1-5) using that specific factor's own bucketing
 * rule (looked up by factor name against lib/risk-scoring/factors.ts — the
 * bucketing rule is code, not DB-stored, since RiskFactor rows only hold the
 * editable category/weight/description metadata), writes the bandScore back
 * onto the input row, sums bandScore x weight, rounds to 2 decimals, and
 * writes Release.weightedRiskScore / weightedRiskLevel.
 *
 * If the release has zero input rows, weightedRiskScore/Level are set to
 * null (never fabricated) so the UI can show "Not assessed".
 */
export async function computeWeightedRiskScore(releaseId: string): Promise<{
  weightedRiskScore: number | null;
  weightedRiskLevel: string | null;
}> {
  const inputs = await prisma.releaseRiskFactorInput.findMany({
    where: { releaseId },
    include: { riskFactor: true },
  });

  if (inputs.length === 0) {
    await prisma.release.update({
      where: { id: releaseId },
      data: { weightedRiskScore: null, weightedRiskLevel: null },
    });
    return { weightedRiskScore: null, weightedRiskLevel: null };
  }

  let weightedSum = 0;
  for (const input of inputs) {
    if (!input.riskFactor.active) continue;

    const bandRule = bandRuleByFactorName.get(input.riskFactor.factorName);
    const bandScore = bandRule ? bandRule(input.rawValue) : input.bandScore ?? 0;

    if (bandScore !== input.bandScore) {
      await prisma.releaseRiskFactorInput.update({
        where: { id: input.id },
        data: { bandScore },
      });
    }

    weightedSum += bandScore * input.riskFactor.weight;
  }

  const weightedRiskScore = Math.round(weightedSum * 100) / 100;
  const weightedRiskLevel = getWeightedRiskLevel(weightedRiskScore);

  await prisma.release.update({
    where: { id: releaseId },
    data: { weightedRiskScore, weightedRiskLevel },
  });

  return { weightedRiskScore, weightedRiskLevel };
}
