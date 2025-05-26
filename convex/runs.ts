import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("runs").collect();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    stats: v.object({
      recorded: v.number(),
      runType: v.string(),
      battleReport: v.optional(
        v.object({
          gameTimeText: v.optional(v.string()),
          gameTime: v.optional(v.number()),
          realTimeText: v.optional(v.string()),
          realTime: v.optional(v.number()),
          realTimeHours: v.optional(v.number()),
          tierText: v.optional(v.string()),
          tier: v.optional(v.number()),
          waveText: v.optional(v.string()),
          wave: v.optional(v.number()),
          coinsEarnedText: v.optional(v.string()),
          coinsEarned: v.optional(v.number()),
          cashEarnedText: v.optional(v.string()),
          cashEarned: v.optional(v.number()),
          cellsEarnedText: v.optional(v.string()),
          cellsEarned: v.optional(v.number()),
          rerollShardsEarnedText: v.optional(v.string()),
          rerollShardsEarned: v.optional(v.number()),
          coinsPerHour: v.optional(v.number()),
          cellsPerHour: v.optional(v.number()),
          rerollShardsPerHour: v.optional(v.number()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const runId = await ctx.db.insert("runs", {
      userId: args.userId,
      recorded: args.stats.recorded,
      runTime: args.stats.runType,
      tier: args.stats.battleReport?.tier,
      wave: args.stats.battleReport?.wave,
      coinsPerHour: args.stats.battleReport?.coinsPerHour,
      cellsPerHour: args.stats.battleReport?.cellsPerHour,
      rerollShardsPerHour: args.stats.battleReport?.rerollShardsPerHour,
      stats: args.stats,
    });

    return { runId };
  },
});
