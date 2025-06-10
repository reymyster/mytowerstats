import { camelCaseToLabel } from "../../utils";
import {
  defaultLargeNumberConfig,
  defaultIntegerConfig,
  defaultIntegerPlusConfig,
  defaultStringConfig,
  defaultTimespanConfig,
  type FieldConfig,
} from "../helpers";

export const combatKeys = [
  "damageTaken",
  "damageTakenWall",
  "damageTakenWhileBerseked",
  "damageGainFromBerserk",
  "deathDefy",
  "lifesteal",
  "damageDealt",
  "projectilesDamage",
  "projectilesCount",
  "thornDamage",
  "orbDamage",
  "landMineDamage",
  "landMinesSpawned",
  "renderArmorDamage",
  "deathRayDamage",
  "smartMissleDamage",
  "innerLandMineDamage",
  "chainLightningDamage",
  "deathWaveDamage",
  "swampDamage",
  "blackHoleDamage",
] as const;

export type CombatKey = (typeof combatKeys)[number];

const _base: Record<CombatKey, FieldConfig> = {} as any;
for (const key of combatKeys as readonly CombatKey[]) {
  _base[key] = defaultLargeNumberConfig(key);
}

export const combatKeyConfig = {
  ..._base,
  deathDefy: defaultIntegerConfig("deathDefy"),
  damageGainFromBerserk: {
    label: camelCaseToLabel("damageGainFromBerserk"),
    validate(raw) {
      return /^\s*[x]([\d.])+\s*$/.test(raw);
    },
    parse(raw) {
      return parseFloat(raw.trim().replace("x", ""));
    },
  },
} satisfies Record<CombatKey, FieldConfig>;
