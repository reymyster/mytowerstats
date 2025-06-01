import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { battleReportKeys } from "../app/types/stats";

function generateProperties<const K extends readonly string[], T>(
  keys: K,
  func: () => T
): { [P in K[number]]: T } {
  const shape = {} as { [P in K[number]]: T };
  for (const key of keys) {
    shape[key as K[number]] = func();
  }
  return shape;
}

function generatePairs(keys: readonly string[]) {
  const shape = v.object({
    text: v.object({ ...generateProperties(keys, v.string) }),
    values: v.object({ ...generateProperties(keys, v.number) }),
  });
  return shape;
}

export default defineSchema({
  runs: defineTable({
    userId: v.string(),
    recorded: v.number(),
    runType: v.string(),
    battleReport: generatePairs(battleReportKeys),
  }),
});
