import type { Route } from "./+types/edit";
import React, { useState, useEffect } from "react";
import { redirect } from "react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";

import type { BreadcrumbHandle } from "@/types/breadcrumb";
import { parseFieldValues, type FieldValue } from "~/lib/runs/field-values";
import { RunInfo } from "@/components/run-info";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "Edit Run",
};

export async function action(args: Route.ActionArgs) {
  const { userId } = await getAuth(args);
  const { runId } = args.params;

  if (!userId || !runId) return;

  let formData = await args.request.formData();
  let preFieldValues = formData.get("fieldValues") as string;
  let fieldValues = JSON.parse(preFieldValues) as FieldValue;
  let preMeta = formData.get("meta") as string;
  let metaValues = JSON.parse(preMeta) as { recorded: number; runType: string };

  const values = parseFieldValues(fieldValues);

  const realTimeHours =
    values.battleReport.values.realTime /
    60 /* seconds/minute */ /
    60; /* minutes/hour */

  const brv = values.battleReport.values;

  await convex.mutation(api.runs.modify, {
    userId,
    runId,
    header: {
      cellsEarnedPerHour: brv.cellsEarned / realTimeHours,
      coinsEarnedPerHour: brv.coinsEarned / realTimeHours,
      realTime: brv.realTime,
      realTimeHours,
      recorded: metaValues.recorded,
      rerollShardsEarnedPerHour: brv.rerollShardsEarned / realTimeHours,
      runType: metaValues.runType,
      tier: brv.tier,
      userId: userId!,
      wave: brv.wave,
    },
    values,
  });

  return redirect(`/runs/analyze/${runId}`);
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  const { runId } = args.params;

  if (!userId || !runId) return undefined;

  const data = await convex.query(api.runs.getSingleFullInfo, {
    userId,
    runId,
  });

  if (!data) return undefined;

  return data;
}

export default function EditRun({ loaderData }: Route.ComponentProps) {
  if (!loaderData)
    return <div className="text-red-600">Error loading data.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl">Edit Run</h2>
      <RunInfo data={loaderData} />
    </div>
  );
}
