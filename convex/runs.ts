import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { type Doc } from "./_generated/dataModel";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("runs").collect();
  },
});

export const getRecentList = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("runs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getSingleFullInfo = query({
  args: { userId: v.string(), runId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const runId = ctx.db.normalizeId("runs", args.runId);
    if (!runId) return;

    const header = await ctx.db.get(runId);

    if (!header || header.userId !== userId) return;

    const values = await ctx.db.get(header.runValueId);

    if (!values) return;

    const screenMeta = await ctx.db
      .query("runScreens")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();

    const screens = (
      await Promise.all(
        header.screens.map(async (s) => {
          const meta = screenMeta.find((m) => m._id === s);

          if (!meta) return undefined;

          return {
            ...meta,
            url: await ctx.storage.getUrl(meta.storageId),
          };
        })
      )
    ).filter((s) => typeof s !== "undefined");

    return { header, values, screens };
  },
});

export const remove = mutation({
  args: { userId: v.string(), runId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const runId = ctx.db.normalizeId("runs", args.runId);
    if (!runId) return;

    const runMeta = await ctx.db.get(runId);

    if (!runMeta || runMeta.userId !== userId) return;

    const screens = await Promise.all(
      runMeta.screens.map(async (s) => await ctx.db.get(s))
    );

    for (let i = 0; i < screens.length; i++) {
      const rsScreen = screens[i];
      if (!rsScreen) continue;
      const { storageId, _id } = rsScreen;
      await ctx.storage.delete(storageId);
      await ctx.db.delete(_id);
    }

    await ctx.db.delete(runMeta.runValueId);
    await ctx.db.delete(runId);
  },
});

export const saveNew = action({
  args: {
    header: v.object({
      cellsEarnedPerHour: v.float64(),
      coinsEarnedPerHour: v.float64(),
      realTime: v.float64(),
      realTimeHours: v.float64(),
      recorded: v.float64(),
      rerollShardsEarnedPerHour: v.float64(),
      runType: v.string(),
      tier: v.float64(),
      userId: v.string(),
      wave: v.float64(),
    }),
    values: v.object({
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
    }),
    files: v.array(
      v.object({
        filename: v.string(),
        size: v.number(),
        lastModified: v.number(),
        file: v.bytes(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const files = await Promise.all(
      args.files.map(async ({ filename, size, lastModified, file }) => {
        const blob = new Blob([file], { type: "image/jpeg" });
        const storageId = await ctx.storage.store(blob);

        return {
          filename,
          size,
          lastModified,
          storageId,
        };
      })
    );

    await ctx.runMutation(internal.runs.create, {
      header: args.header,
      values: args.values,
      files,
    });
  },
});

export const create = internalMutation({
  args: {
    header: v.object({
      cellsEarnedPerHour: v.float64(),
      coinsEarnedPerHour: v.float64(),
      realTime: v.float64(),
      realTimeHours: v.float64(),
      recorded: v.float64(),
      rerollShardsEarnedPerHour: v.float64(),
      runType: v.string(),
      tier: v.float64(),
      userId: v.string(),
      wave: v.float64(),
    }),
    values: v.object({
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
    }),
    files: v.array(
      v.object({
        filename: v.string(),
        size: v.number(),
        lastModified: v.number(),
        storageId: v.id("_storage"),
      })
    ),
  },
  handler: async (ctx, args) => {
    const runValueId = await ctx.db.insert("runValues", {
      ...args.values,
      runId: null,
    });
    const screens = await Promise.all(
      args.files.map(async (file) => {
        return await ctx.db.insert("runScreens", { ...file, runId: null });
      })
    );
    const runId = await ctx.db.insert("runs", {
      ...args.header,
      runValueId,
      screens,
    });
    await ctx.db.patch(runValueId, { runId });

    await Promise.all(
      screens.map(async (s) => {
        await ctx.db.patch(s, { runId });
      })
    );

    return { runId, runValueId, screens };
  },
});
