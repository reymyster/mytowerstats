import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("runs").collect();
  },
});

export const create = mutation({
  handler: async (ctx, args: Omit<Doc<"runs">, "_id" | "_creationTime">) => {
    const runId = await ctx.db.insert("runs", { ...args });

    return { runId };
  },
});
