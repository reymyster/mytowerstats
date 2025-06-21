import {
  sectionNames,
  configsBySection,
  type SectionName,
} from "./all-labels-map";
import {
  battleReportKeys,
  type BattleReportKey,
} from "./sections/battle-report";
import { combatKeys, type CombatKey } from "./sections/combat";
import { utilityKeys, type UtilityKey } from "./sections/utility";
import type { Doc } from "convex/_generated/dataModel";

export type FieldValue = {
  [section: string]: {
    [key: string]: string;
  };
};

export function getDefaultFieldValue(values?: Doc<"runValues">): FieldValue {
  if (!values)
    return {
      battleReport: battleReportKeys.reduce((p, c) => ({ ...p, [c]: "" }), {}),
      combat: combatKeys.reduce((p, c) => ({ ...p, [c]: "" }), {}),
      utility: utilityKeys.reduce((p, c) => ({ ...p, [c]: "" }), {}),
    };

  return {
    battleReport: battleReportKeys.reduce(
      (p, c) => ({ ...p, [c]: values.battleReport.text[c] }),
      {}
    ),
    combat: combatKeys.reduce(
      (p, c) => ({ ...p, [c]: values.combat.text[c] }),
      {}
    ),
    utility: utilityKeys.reduce(
      (p, c) => ({ ...p, [c]: values.utility.text[c] }),
      {}
    ),
  };
}

export function parseFieldValues(f: FieldValue) {
  const battleReportText = f["battleReport"] as Record<BattleReportKey, string>;
  const battleReportValues = battleReportKeys.reduce(
    (p, c) => ({
      ...p,
      [c]: configsBySection.battleReport[c].parse(battleReportText[c]),
    }),
    {} as Record<BattleReportKey, number>
  );

  const combatText = f["combat"] as Record<CombatKey, string>;
  const combatValues = combatKeys.reduce(
    (p, c) => ({
      ...p,
      [c]: configsBySection.combat[c].parse(combatText[c]),
    }),
    {} as Record<CombatKey, number>
  );

  const utilityText = f["utility"] as Record<UtilityKey, string>;
  const utilityValues = utilityKeys.reduce(
    (p, c) => ({
      ...p,
      [c]: configsBySection.utility[c].parse(utilityText[c]),
    }),
    {} as Record<UtilityKey, number>
  );

  return {
    battleReport: {
      text: battleReportText,
      values: battleReportValues,
    },
    combat: {
      text: combatText,
      values: combatValues,
    },
    utility: {
      text: utilityText,
      values: utilityValues,
    },
  };
}
