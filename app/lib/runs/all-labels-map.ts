import {
  battleReportKeys,
  battleReportConfig,
  type BattleReportKey,
} from "./sections/battle-report";
import { combatKeys, combatKeyConfig, type CombatKey } from "./sections/combat";
import {
  utilityKeys,
  utilityKeyConfig,
  type UtilityKey,
} from "./sections/utility";

// #region Verify Key uniqueness across sections at TS compile time
type OverlappingKeys = Extract<Extract<BattleReportKey, CombatKey>, UtilityKey>;
// if there is any overlap, OverlappingKeys is not `never`
// we force the compiler to error by insisting that OverlappingKeys must be `never`
type AssertNoKeyOverlap = OverlappingKeys extends never
  ? true
  : ["Duplicate keys found:", OverlappingKeys];
// create a dummy constant that must satisfy `AssertNoKeyOverlap`
const _checkKeyOverlap: AssertNoKeyOverlap = true;
// #endregion

export const sectionNames = ["battleReport", "combat", "utility"] as const;
export type SectionName = (typeof sectionNames)[number];
export type AnyKey = BattleReportKey | CombatKey | UtilityKey;
export type LabelLookup = { section: SectionName; key: AnyKey };

export const configsBySection = {
  battleReport: battleReportConfig,
  combat: combatKeyConfig,
  utility: utilityKeyConfig,
} as const;

export type KeysBySection =
  | { section: "battleReport"; key: BattleReportKey }
  | { section: "combat"; key: CombatKey }
  | { section: "utility"; key: UtilityKey };

export const allLabelsToKeys: Record<string, LabelLookup> = {
  ...Object.fromEntries(
    (Object.entries(battleReportConfig) as [BattleReportKey, unknown][]).map(
      ([k, cfg]) => {
        const label = (cfg as { label: string }).label;
        return [label, { section: "battleReport" as const, key: k }];
      }
    )
  ),
  ...Object.fromEntries(
    (Object.entries(combatKeyConfig) as [CombatKey, unknown][]).map(
      ([k, cfg]) => {
        const label = (cfg as { label: string }).label;
        return [label, { section: "combat" as const, key: k }];
      }
    )
  ),
  ...Object.fromEntries(
    (Object.entries(utilityKeyConfig) as [UtilityKey, unknown][]).map(
      ([k, cfg]) => {
        const label = (cfg as { label: string }).label;
        return [label, { section: "utility" as const, key: k }];
      }
    )
  ),
};
