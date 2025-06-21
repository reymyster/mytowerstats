import type { Route } from "./+types/analyze";
import React, { useState, useEffect } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";

import type { BreadcrumbHandle } from "@/types/breadcrumb";
import { abbreviateNumber } from "~/lib/stats";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

import { Bar, BarChart, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "Analyze Run",
};

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  const { runId } = args.params;

  if (!userId || !runId) return undefined;

  const data = await convex.query(api.runs.getSingleFullInfo, {
    userId,
    runId,
  });

  if (!data) return undefined;

  const combatValues = data.values.combat.values;

  const damageShareData = [
    {
      from: "blackHole",
      damage: (combatValues.blackHoleDamage * 100) / combatValues.damageDealt,
      fill: "var(--color-blackHole)",
    },
    {
      from: "chainLightning",
      damage:
        (combatValues.chainLightningDamage * 100) / combatValues.damageDealt,
      fill: "var(--color-chainLightning)",
    },
    {
      from: "orb",
      damage: (combatValues.orbDamage * 100) / combatValues.damageDealt,
      fill: "var(--color-orb)",
    },
    {
      from: "swamp",
      damage: (combatValues.swampDamage * 100) / combatValues.damageDealt,
      fill: "var(--color-swamp)",
    },
    {
      from: "thorn",
      damage: (combatValues.thornDamage * 100) / combatValues.damageDealt,
      fill: "var(--color-thorn)",
    },
  ];

  return { damageShareData };
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const damageShareConfig = {
  orb: {
    label: "Orb",
    color: "var(--chart-1)",
  },
  chainLightning: {
    label: "Chain Lightning",
    color: "var(--chart-3)",
  },
  blackHole: {
    label: "Black Hole",
    color: "var(--chart-5)",
  },
  swamp: {
    label: "Swamp",
    color: "var(--chart-2)",
  },
  thorn: {
    label: "Thorn",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export default function AnalyzeRun({ loaderData }: Route.ComponentProps) {
  if (!loaderData)
    return <div className="text-red-600">Error loading data.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl">Analyze Run</h2>
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Damage Share</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={damageShareConfig}
            className="mx-auto aspect-square max-h-[400px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => (
                      <div className="flex flex-row min-w-[148px] items-center justify-between text-xs text-muted-foreground">
                        {damageShareConfig[
                          name as keyof typeof damageShareConfig
                        ]?.label || name}
                        <div className="ml-auto flex items-baseline font-mono font-medium tabular-nums text-foreground">
                          {(value as number).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={loaderData.damageShareData}
                dataKey="damage"
                nameKey="from"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
