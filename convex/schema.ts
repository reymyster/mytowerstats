import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { battleReportKeys } from "../app/lib/runs/sections/battle-report";
import { combatKeys } from "../app/lib/runs/sections/combat";
import { utilityKeys } from "../app/lib/runs/sections/utility";

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

/*
export default defineSchema({
  runs: defineTable({
    userId: v.string(),
    recorded: v.number(),
    runType: v.string(),
    realTime: v.number(),
    realTimeHours: v.number(),
    tier: v.number(),
    wave: v.number(),
    coinsEarnedPerHour: v.number(),
    cellsEarnedPerHour: v.number(),
    rerollShardsEarnedPerHour: v.number(),
    runValueId: v.id("runValues"),
    screens: v.array(v.id("runScreens")),
  }).index("by_user", ["userId"]),
  runScreens: defineTable({
    runId: v.union(v.id("runs"), v.null()),
    storageId: v.id("_storage"),
    filename: v.string(),
    size: v.number(),
    lastModified: v.number(),
  }).index("by_run", ["runId"]),
  runValues: defineTable({
    runId: v.union(v.id("runs"), v.null()),
    battleReport: generatePairs(battleReportKeys),
    combat: generatePairs(combatKeys),
    utility: generatePairs(utilityKeys),
  }).index("by_run", ["runId"]),
});
*/

export default defineSchema({
  runScreens: defineTable({
    filename: v.string(),
    lastModified: v.float64(),
    runId: v.union(v.id("runs"), v.null()),
    size: v.float64(),
    storageId: v.id("_storage"),
  }).index("by_run", ["runId"]),
  runValues: defineTable({
    battleReport: v.object({
      text: v.object({
        cashEarned: v.string(),
        cellsEarned: v.string(),
        coinsEarned: v.string(),
        gameTime: v.string(),
        gemBlocksTapped: v.string(),
        interestEarned: v.string(),
        killedBy: v.string(),
        realTime: v.string(),
        rerollShardsEarned: v.string(),
        tier: v.string(),
        wave: v.string(),
      }),
      values: v.object({
        cashEarned: v.float64(),
        cellsEarned: v.float64(),
        coinsEarned: v.float64(),
        gameTime: v.float64(),
        gemBlocksTapped: v.float64(),
        interestEarned: v.float64(),
        killedBy: v.float64(),
        realTime: v.float64(),
        rerollShardsEarned: v.float64(),
        tier: v.float64(),
        wave: v.float64(),
      }),
    }),
    combat: v.object({
      text: v.object({
        blackHoleDamage: v.string(),
        chainLightningDamage: v.string(),
        damageDealt: v.string(),
        damageGainFromBerserk: v.string(),
        damageTaken: v.string(),
        damageTakenWall: v.string(),
        damageTakenWhileBerserked: v.string(),
        deathDefy: v.string(),
        deathRayDamage: v.string(),
        deathWaveDamage: v.string(),
        innerLandMineDamage: v.string(),
        landMineDamage: v.string(),
        landMinesSpawned: v.string(),
        lifesteal: v.string(),
        orbDamage: v.string(),
        projectilesCount: v.string(),
        projectilesDamage: v.string(),
        renderArmorDamage: v.string(),
        smartMissileDamage: v.string(),
        swampDamage: v.string(),
        thornDamage: v.string(),
      }),
      values: v.object({
        blackHoleDamage: v.float64(),
        chainLightningDamage: v.float64(),
        damageDealt: v.float64(),
        damageGainFromBerserk: v.float64(),
        damageTaken: v.float64(),
        damageTakenWall: v.float64(),
        damageTakenWhileBerserked: v.float64(),
        deathDefy: v.float64(),
        deathRayDamage: v.float64(),
        deathWaveDamage: v.float64(),
        innerLandMineDamage: v.float64(),
        landMineDamage: v.float64(),
        landMinesSpawned: v.float64(),
        lifesteal: v.float64(),
        orbDamage: v.float64(),
        projectilesCount: v.float64(),
        projectilesDamage: v.float64(),
        renderArmorDamage: v.float64(),
        smartMissileDamage: v.float64(),
        swampDamage: v.float64(),
        thornDamage: v.float64(),
      }),
    }),
    runId: v.union(v.id("runs"), v.null()),
    utility: v.object({
      text: v.object({
        cashFromGoldenTower: v.string(),
        coinsFromBlackhole: v.string(),
        coinsFromDeathWave: v.string(),
        coinsFromGoldenTower: v.string(),
        coinsFromSpotlight: v.string(),
        freeAttackUpgrade: v.string(),
        freeDefenseUpgrade: v.string(),
        freeUtilityUpgrade: v.string(),
        hpFromDeathWave: v.string(),
        recoveryPackages: v.string(),
        wavesSkipped: v.string(),
      }),
      values: v.object({
        cashFromGoldenTower: v.float64(),
        coinsFromBlackhole: v.float64(),
        coinsFromDeathWave: v.float64(),
        coinsFromGoldenTower: v.float64(),
        coinsFromSpotlight: v.float64(),
        freeAttackUpgrade: v.float64(),
        freeDefenseUpgrade: v.float64(),
        freeUtilityUpgrade: v.float64(),
        hpFromDeathWave: v.float64(),
        recoveryPackages: v.float64(),
        wavesSkipped: v.float64(),
      }),
    }),
  }).index("by_run", ["runId"]),
  runs: defineTable({
    cellsEarnedPerHour: v.float64(),
    coinsEarnedPerHour: v.float64(),
    realTime: v.float64(),
    realTimeHours: v.float64(),
    recorded: v.float64(),
    rerollShardsEarnedPerHour: v.float64(),
    runType: v.string(),
    runValueId: v.id("runValues"),
    screens: v.array(v.id("runScreens")),
    tier: v.float64(),
    userId: v.string(),
    wave: v.float64(),
  }).index("by_user", ["userId"]),
});
