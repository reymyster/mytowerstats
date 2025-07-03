import type { Route } from "./+types/analyze";
import React, { useState, useEffect } from "react";
import { data as dataError } from "react-router";

import type { BreadcrumbHandle } from "@/types/breadcrumb";
import { combatKeys } from "~/lib/runs/sections/combat";
import { camelCaseToLabel } from "~/lib/utils";

import { Effect } from "effect";
import { RuntimeServer } from "~/lib/RuntimeServer";
import { ClerkService } from "~/lib/services/ClerkService";
import { TowerRunService } from "~/lib/services/TowerRunService";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
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
  const logic = Effect.gen(function* () {
    const clerkService = yield* ClerkService;
    const runService = yield* TowerRunService;

    const { runId } = args.params;
    const { userId } = yield* clerkService.getUser(args);

    return yield* runService.getDetails(userId, runId);
  });
  const errorHandling = logic.pipe(
    Effect.catchTags({
      ClerkServiceError: (e) => Effect.succeed(`Clerk error: ${e.message}`),
      TowerRunServiceError: (e) => Effect.succeed(`Convex Error: ${e.message}`),
    })
  );

  const data = await RuntimeServer.runPromise(errorHandling);

  if (typeof data === "string") throw dataError(data, { status: 500 });

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
  return (
    <div className="p-4 flex flex-row flex-wrap">
      <Card className="w-full lg:max-w-1/3 2xl:max-w-1/4 bg-background/50">
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
                  width={120}
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
