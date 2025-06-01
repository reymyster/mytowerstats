export const battleReportKeys = [
  "gameTime",
  "realTime",
  "tier",
  "wave",
  "killedBy",
  "coinsEarned",
  "cashEarned",
  "interestEarned",
  "gemBlocksTapped",
  "cellsEarned",
  "rerollShardsEarned",
] as const;

type BattleReportKey = (typeof battleReportKeys)[number];

export type Run = {
  recorded: number;
  runType: "farming" | "milestone" | "tournament";
  battleReport: {
    text: { [K in BattleReportKey]: string };
    value: { [K in BattleReportKey]: number };
  };
};
