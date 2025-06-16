import {
  defaultLargeNumberConfig,
  defaultIntegerConfig,
  defaultIntegerPlusConfig,
  defaultStringConfig,
  defaultTimespanConfig,
  type FieldConfig,
} from "../helpers";

export const utilityKeys = [
  "wavesSkipped",
  "recoveryPackages",
  "freeAttackUpgrade",
  "freeDefenseUpgrade",
  "freeUtilityUpgrade",
  "hpFromDeathWave",
  "coinsFromDeathWave",
  "coinsFromGoldenTower",
  "cashFromGoldenTower",
  "coinsFromBlackhole",
  "coinsFromSpotlight",
] as const;

export type UtilityKey = (typeof utilityKeys)[number];

const _base: Record<UtilityKey, FieldConfig> = {} as any;
for (const key of utilityKeys as readonly UtilityKey[]) {
  _base[key] = defaultLargeNumberConfig(key);
}

export const utilityKeyConfig = {
  ..._base,
  wavesSkipped: defaultIntegerConfig("wavesSkipped"),
  recoveryPackages: defaultIntegerConfig("recoveryPackages"),
  freeAttackUpgrade: defaultIntegerConfig("freeAttackUpgrade"),
  freeDefenseUpgrade: defaultIntegerConfig("freeDefenseUpgrade"),
  freeUtilityUpgrade: defaultIntegerConfig("freeUtilityUpgrade"),
} satisfies Record<UtilityKey, FieldConfig>;
