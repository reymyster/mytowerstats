import {
  battleReportKeys,
  battleReportConfig,
  type BattleReportKey,
} from "./runs/sections/battle-report";
import {
  combatKeys,
  combatKeyConfig,
  type CombatKey,
} from "./runs/sections/combat";

// #region Verify Key uniqueness across sections at TS compile time
type OverlappingKeys = Extract<BattleReportKey, CombatKey>;
// if there is any overlap, OverlappingKeys is not `never`
// we force the compiler to error by insisting that OverlappingKeys must be `never`
type AssertNoKeyOverlap = OverlappingKeys extends never
  ? true
  : ["Duplicate keys found:", OverlappingKeys];
// create a dummy constant that must satisfy `AssertNoKeyOverlap`
const _checkKeyOverlap: AssertNoKeyOverlap = true;
// #endregion

export type SectionName = "battleReport" | "combat";
export type AnyKey = BattleReportKey | CombatKey;
export type LabelLookup = { section: SectionName; key: AnyKey };

// export const allLabelsToKeys = Object.freeze<LabelLookup>({
//     ...(Object.fromEntries(
//         Object.entries(battl)
//     )
// })
