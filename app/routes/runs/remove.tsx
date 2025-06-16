import type { Route } from "./+types/remove";
import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

export async function action(args: Route.ActionArgs) {
  const { userId } = await getAuth(args);
  const { runId } = args.params;
  if (!userId || !runId) return;

  await convex.mutation(api.runs.remove, { userId, runId });
}
