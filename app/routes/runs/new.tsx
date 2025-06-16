import type { Route } from "./+types/new";
import React, { useState, useEffect } from "react";
import { Form, redirect } from "react-router";
import type { BreadcrumbHandle } from "@/types/breadcrumb";
import { RunInfo } from "@/components/run-info";
import { parseFieldValues, type FieldValue } from "~/lib/runs/field-values";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { BattleReportKey } from "~/lib/runs/sections/battle-report";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "New Run",
};

export async function action(args: Route.ActionArgs) {
  const { userId } = await getAuth(args);
  let formData = await args.request.formData();

  let preFieldValues = formData.get("fieldValues") as string;
  let fieldValues = JSON.parse(preFieldValues) as FieldValue;
  let preMeta = formData.get("meta") as string;
  let metaValues = JSON.parse(preMeta) as { recorded: number; runType: string };
  let preFileInfo = formData.get("fileInfo") as string;
  console.log({ preFileInfo });
  let fileInfo = JSON.parse(preFileInfo) as {
    filename: string;
    size: number;
    lastModified: number;
  }[];

  const screenshots = formData.getAll("screenshots") as File[];

  const files = await Promise.all(
    screenshots.map(async (f) => {
      const { filename, size, lastModified } = fileInfo.find(
        (fi) => fi.filename === f.name
      )!;
      return {
        filename,
        size,
        lastModified,
        file: await f.arrayBuffer(),
      };
    })
  );

  const values = parseFieldValues(fieldValues);

  const realTimeHours =
    values.battleReport.values.realTime /
    60 /* seconds/minute */ /
    60; /* minutes/hour */

  const brv = values.battleReport.values;

  await convex.action(api.runs.saveNew, {
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
    files,
  });

  return redirect("/runs");
}

export default function NewRun() {
  return (
    <div className="p-4">
      <h2 className="text-2xl">New Run</h2>
      <RunInfo />
    </div>
  );
}
