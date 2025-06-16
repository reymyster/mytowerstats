import {
  defaultLargeNumberConfig,
  defaultIntegerConfig,
  defaultIntegerPlusConfig,
  defaultStringConfig,
  defaultTimespanConfig,
  type FieldConfig,
} from "../helpers";

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

export type BattleReportKey = (typeof battleReportKeys)[number];

// a skeleton object that has every key -> defaultConfig
// start by assuming everything is a large number
// then override specific instances later
const _base: Record<BattleReportKey, FieldConfig> = {} as any;
for (const key of battleReportKeys as readonly BattleReportKey[]) {
  _base[key] = defaultLargeNumberConfig(key);
}

export const battleReportConfig = {
  ..._base,
  // Time Spans
  gameTime: defaultTimespanConfig("gameTime"),
  realTime: defaultTimespanConfig("realTime"),
  // e.g. 12, 14+ for tourneyss
  tier: defaultIntegerPlusConfig("tier"),
  // pure integers
  wave: defaultIntegerConfig("wave"),
  gemBlocksTapped: defaultIntegerConfig("gemBlocksTapped"),
  // e.g. Killed By Ray, Killed By Vampire
  killedBy: defaultStringConfig("killedBy"),
} satisfies Record<BattleReportKey, FieldConfig>;
