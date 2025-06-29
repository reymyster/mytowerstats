import type { Route } from "./+types/analyze";
import React, { useState, useEffect } from "react";
import { data as dataError } from "react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";

import type { BreadcrumbHandle } from "@/types/breadcrumb";
import { combatKeys } from "~/lib/runs/sections/combat";
import { camelCaseToLabel } from "~/lib/utils";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
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
  const damagePrefixes = [...combatKeys]
    .filter((k) => k.endsWith("Damage"))
    .map((k) => k.replace(/Damage$/, ""));

  const damageShareData = damagePrefixes
    .map((prefix) => {
      const damageRaw =
        combatValues[`${prefix}Damage` as keyof typeof combatValues];
      const damagePercentage = (damageRaw * 100) / combatValues.damageDealt;
      const damage = Number(damagePercentage.toFixed(2));

      return {
        from: prefix,
        damage,
        fill: `var(--color-${prefix})`,
      };
    })
    .toSorted((a, b) => b.damage - a.damage)
    .filter((d, i) => d.damage > 0.01 && i < 10); // limitation based on chart colors

  const damageShareConfig = damageShareData.reduce(
    (p, c, i) => ({
      ...p,
      [c.from]: {
        label: camelCaseToLabel(c.from),
        color: `var(--chart-${i + 1})`,
      },
    }),
    {} as Record<string, { label: string; color: string }>
  ) satisfies ChartConfig;

  return { damageShareData, damageShareConfig };
}

export default function AnalyzeRun({ loaderData }: Route.ComponentProps) {
  console.log({ loaderData });
  return (
    <div className="p-4 flex flex-row flex-wrap">
      <Card className="aspect-4/5 w-full lg:max-w-1/3 bg-background/50">
        <CardHeader>
          <CardTitle>Damage Share</CardTitle>
          <CardContent className="aspect-4/5">
            <ChartContainer
              config={loaderData.damageShareConfig}
              className="!aspect-auto h-full"
            >
              <BarChart
                accessibilityLayer
                data={loaderData.damageShareData}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <YAxis
                  dataKey="from"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={90}
                  tickFormatter={(value) =>
                    loaderData.damageShareConfig[
                      value as keyof typeof loaderData.damageShareConfig
                    ]?.label
                  }
                />
                <XAxis dataKey="damage" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => (
                        <div className="flex flex-row w-26 text-foreground items-center justify-between">
                          <span className="text-muted-foreground">Damage</span>
                          <span className="font-mono tabular-nums">
                            {value}%
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="damage" layout="vertical" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}
