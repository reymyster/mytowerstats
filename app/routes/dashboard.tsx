import type { Route } from "./+types/dashboard";
import React, { useState, useEffect } from "react";
import type { BreadcrumbHandle } from "~/types/breadcrumb";
import { data as dataError } from "react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { format } from "date-fns";
import { abbreviateNumber } from "~/lib/stats";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "Home",
};

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  if (!userId) throw dataError("User not logged in.", { status: 401 });

  const data = await convex.query(api.runs.getRecentList, { userId });

  if (!data) return undefined;

  const forFarming = (() => {
    const farmingRuns = data
      .filter((d) => d.runType === "farming")
      .toSorted((a, b) => a.recorded - b.recorded);

    if (farmingRuns.length === 0) return undefined;

    const cells = farmingRuns.reduce(
      (p, c) => (c.cellsEarnedPerHour > p.cellsEarnedPerHour ? c : p),
      farmingRuns[0]
    );

    const coins = farmingRuns.reduce(
      (p, c) => (c.coinsEarnedPerHour > p.coinsEarnedPerHour ? c : p),
      farmingRuns[0]
    );

    const shards = farmingRuns.reduce(
      (p, c) =>
        c.rerollShardsEarnedPerHour > p.rerollShardsEarnedPerHour ? c : p,
      farmingRuns[0]
    );

    var tiersSet = new Set(farmingRuns.map((f) => f.tier));
    const distinctTiers = Array.from(tiersSet.values()).toSorted(
      (a, b) => a - b
    );
    const runsByTier = new Map(
      distinctTiers.map((tier) => [
        tier,
        farmingRuns.filter((f) => f.tier === tier),
      ])
    );

    const coinGraphConfig = distinctTiers.reduce(
      (p, c, i) => ({
        ...p,
        [c.toString()]: {
          label: `Tier ${c}`,
          color: `var(--chart-${3 * i + 1})`,
        },
      }),
      {} as Record<string, { label: string; color: string }>
    );

    const averageCoinsByTier = distinctTiers.reduce(
      (p, c) => ({
        ...p,
        [c]:
          (runsByTier
            .get(c)
            ?.reduce((pp, cc) => pp + cc.coinsEarnedPerHour, 0) ?? 0) /
          (runsByTier.get(c)?.length ?? 1),
      }),
      {} as Record<string, number>
    );

    const coinGraphData = farmingRuns.map((run) => {
      const { recorded, tier, coinsEarnedPerHour } = run;
      return {
        recorded,
        ...averageCoinsByTier,
        [tier]: coinsEarnedPerHour,
      };
    });

    return {
      cells,
      coins,
      shards,
      coinGraphConfig,
      coinGraphData,
      distinctTiers,
    };
  })();

  return { forFarming };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const [farmingSection, setFarmingSection] = useState<
    "coins" | "cells" | "shards"
  >("coins");

  if (!loaderData) return <div className="text-red-600">No data.</div>;

  console.log({
    coinGraphConfig: loaderData.forFarming?.coinGraphConfig,
    coinGraphData: loaderData.forFarming?.coinGraphData,
    tiers: loaderData.forFarming?.distinctTiers,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {typeof loaderData.forFarming !== "undefined" && (
        <div className="aspect-4/1 rounded-xl bg-muted/50 p-2">
          <Tabs className="w-full" value={farmingSection}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="coins"
                onClick={() => setFarmingSection("coins")}
              >
                Coins/Hour
              </TabsTrigger>
              <TabsTrigger
                value="cells"
                onClick={() => setFarmingSection("cells")}
              >
                Cells/Hour
              </TabsTrigger>
              <TabsTrigger
                value="shards"
                onClick={() => setFarmingSection("shards")}
              >
                Reroll Shards/Hour
              </TabsTrigger>
            </TabsList>
            <TabsContent value="coins" className="aspect-4/1">
              <ChartContainer
                config={loaderData.forFarming.coinGraphConfig}
                className="!aspect-auto h-full"
              >
                <LineChart
                  accessibilityLayer
                  data={loaderData.forFarming.coinGraphData}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="recorded"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) =>
                      format(new Date(value as number), "L/d")
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => (
                          <div className="flex flex-row w-28 text-foreground items-center justify-between">
                            <span>
                              {loaderData.forFarming!.coinGraphConfig[
                                name as keyof typeof loaderData.forFarming.coinGraphConfig
                              ]?.label || name}
                            </span>
                            <span className="font-mono tabular-nums text-muted-foreground">
                              {abbreviateNumber(value as number)}/H
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  {loaderData.forFarming.distinctTiers.map((tier: number) => (
                    <Line
                      key={tier}
                      dataKey={tier}
                      stroke={`var(--color-${tier})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </div>
      )}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-33/9 rounded-xl bg-muted/50 p-2 lg:p-4 flex flex-col gap-2 border border-foreground/30">
          <h3 className="text-xl">Farm</h3>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div>Coins</div>
            <div className="text-right">
              Tier {loaderData.forFarming?.coins.tier}
            </div>
            <div>Cells</div>
            <div className="text-right">
              Tier {loaderData.forFarming?.cells.tier}
            </div>
            <div>Reroll Shards</div>
            <div className="text-right">
              Tier {loaderData.forFarming?.shards.tier}
            </div>
          </div>
        </div>
        <div className="aspect-33/9 rounded-xl bg-muted/50 border border-foreground/30" />
        <div className="aspect-33/9 rounded-xl bg-muted/50 border border-foreground/30" />
      </div>
    </div>
  );
}
