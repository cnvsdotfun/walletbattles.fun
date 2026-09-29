import { z } from "zod";

export const WalletSnapshotSchema = z.object({
  netPnlSol: z.number().finite(),
  profitableClosedTrades: z.number().int().min(0),
  closedTrades: z.number().int().min(0),
  maxDrawdownPercent: z.number().min(0).max(100),
  downsideVolatilityPercent: z.number().min(0).max(100),
  totalBalanceSol: z.number().min(0),
});

export type WalletSnapshot = z.infer<typeof WalletSnapshotSchema>;

export type RatingBreakdown = {
  rating: number;
  profitScore: number;
  winRateScore: number;
  riskScore: number;
  confidence: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function calculateBattleRating(input: WalletSnapshot): RatingBreakdown {
  const snapshot = WalletSnapshotSchema.parse(input);
  const confidence = clamp(snapshot.closedTrades / 20, 0, 1);
  const positiveProfit = Math.tanh(
    Math.log1p(Math.max(0, snapshot.netPnlSol) * 10) / 2.8,
  );
  const lossPenalty = Math.tanh(
    Math.abs(Math.min(0, snapshot.netPnlSol)) / Math.max(snapshot.totalBalanceSol, 1),
  );
  const profitScore = clamp(50 + positiveProfit * 50 - lossPenalty * 50, 0, 100);
  const winRateScore = snapshot.closedTrades
    ? (snapshot.profitableClosedTrades / snapshot.closedTrades) * 100
    : 0;
  const riskScore = clamp(
    100 - snapshot.maxDrawdownPercent * 1.5 - snapshot.downsideVolatilityPercent * 1.2,
    0,
    100,
  );
  const weightedScore =
    profitScore * 0.55 + winRateScore * 0.25 + riskScore * 0.2;
  const rating = Math.round(clamp(weightedScore * (0.55 + confidence * 0.45), 1, 100));

  return {
    rating,
    profitScore: Math.round(profitScore),
    winRateScore: Math.round(winRateScore),
    riskScore: Math.round(riskScore),
    confidence,
  };
}

