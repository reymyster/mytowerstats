import type { Route } from "./+types/analyze";
import React, { useState, useEffect } from "react";
import { data as dataError } from "react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";

import type { BreadcrumbHandle } from "@/types/breadcrumb";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

import { Bar, BarChart, Pie, PieChart, LabelList } from "recharts";
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "Analyze Run",
};

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  if (!userId) throw dataError("User not logged in.", { status: 401 });
  const { runId } = args.params;
  if (!runId) throw dataError("Run ID missing.", { status: 400 });

  const data = await convex.query(api.runs.getSingleFullInfo, {
    userId,
    runId,
  });

  if (!data) throw dataError("Run not found.", { status: 404 });

  const combatValues = data.values.combat.values;

  const getDamage = (key: string) => {
    const damagePercentage =
      (combatValues[`${key}Damage` as keyof typeof combatValues] * 100) /
      combatValues.damageDealt;
    const damage = Number(damagePercentage.toFixed(2));
    return {
      from: key,
      damage,
      fill: `var(--color-${key})`,
    };
  };

  const damageShareData = [
    getDamage("blackHole"),
    getDamage("chainLightning"),
    getDamage("orb"),
    getDamage("swamp"),
    getDamage("thorn"),
    getDamage("deathWave"),
    getDamage("projectiles"),
  ]
    .filter((d) => d.damage > 0.5)
    .toSorted((a, b) => b.damage - a.damage);

  return { damageShareData };
}

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
  deathWave: {
    label: "Death Wave",
    color: "var(--chart-6)",
  },
  projectiles: {
    label: "Projectiles",
    color: "var(--chart-7)",
  },
} satisfies ChartConfig;

export default function AnalyzeRun({ loaderData }: Route.ComponentProps) {
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
              >
                <LabelList
                  dataKey="from"
                  fontSize={12}
                  position={"outside"}
                  offset={10}
                  formatter={(value: keyof typeof damageShareConfig) =>
                    damageShareConfig[value]?.label
                  }
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
