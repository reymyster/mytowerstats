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

// export const fieldValueSections = [...sectionNames, "header"] as const;
// export type FieldValueSection = (typeof fieldValueSections)[number];

export type FieldValue = {
  [section: string]: {
    [key: string]: string;
  };
};

// export type FieldValue = {
//   header: {
//     recorded: number;
//     runType: string;
//   };
//   battleReport: Record<BattleReportKey, string>;
//   combat: Record<CombatKey, string>;
//   utility: Record<UtilityKey, string>;
// };

export function getDefaultFieldValue(): FieldValue {
  return {
    battleReport: battleReportKeys.reduce((p, c) => ({ ...p, [c]: "" }), {}),
    combat: combatKeys.reduce((p, c) => ({ ...p, [c]: "" }), {}),
    utility: utilityKeys.reduce((p, c) => ({ ...p, [c]: "" }), {}),
  };
}

export const defaultFieldValues = getDefaultFieldValue();

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
