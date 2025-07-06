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
import { SingleRunAnalysisService } from "~/lib/services/SingleRunAnalysisService";

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
    const clerk = yield* ClerkService;
    const runs = yield* TowerRunService;
    const analysis = yield* SingleRunAnalysisService;

    const { runId } = args.params;
    const { userId } = yield* clerk.getUser(args);

    const runData = yield* runs.getDetails(userId, runId);

    const damageShare = yield* analysis.calculateDamageShare(runData.values);

    return { damageShare };
  });
  const withErrorHandling = logic.pipe(
    Effect.catchTags({
      ClerkServiceError: (e) => Effect.succeed(`Clerk error: ${e.message}`),
      ConvexServiceError: (e) => Effect.succeed(`Convex error: ${e.message}`),
      TowerRunServiceError: (e) =>
        Effect.succeed(`Run Retrieval Error: ${e.message}`),
    })
  );

  const data = await RuntimeServer.runPromise(withErrorHandling);

  if (typeof data === "string") throw dataError(data, { status: 500 });

  return data;
}

export default function AnalyzeRun({ loaderData }: Route.ComponentProps) {
  return (
    <div className="p-4 flex flex-row flex-wrap">
      <Card className="w-full lg:max-w-1/3 2xl:max-w-1/4 bg-background/50">
        <CardHeader>
          <CardTitle>Damage Share</CardTitle>
          <CardContent className="aspect-4/5">
            <ChartContainer
              config={loaderData.damageShare.config}
              className="!aspect-auto h-full"
            >
              <BarChart
                accessibilityLayer
                data={loaderData.damageShare.data}
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
                    loaderData.damageShare.config[
                      value as keyof typeof loaderData.damageShare.config
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
