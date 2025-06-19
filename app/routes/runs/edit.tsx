import type { Route } from "./+types/edit";
import React, { useState, useEffect } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";

import type { BreadcrumbHandle } from "@/types/breadcrumb";
import { RunInfo } from "@/components/run-info";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "Edit Run",
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
