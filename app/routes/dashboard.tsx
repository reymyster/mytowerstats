import type { Route } from "./+types/dashboard";
import type { BreadcrumbHandle } from "~/types/breadcrumb";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "Home",
};

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  if (!userId) return undefined;

  const data = await convex.query(api.runs.getRecentList, { userId });

  if (!data) return undefined;

  const forFarming = (() => {
    const farmingRuns = data.filter((d) => d.runType === "farming");

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

    return { cells, coins, shards };
  })();

  return { forFarming };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  if (!loaderData)
    return <div className="text-red-600">Error loading data.</div>;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 p-2 flex flex-col gap-2">
          <h3 className="text-xl">Farming</h3>
          <div className="grid grid-cols-2 gap-1">
            <div>Coins</div>
            <div className="text-right">
              {loaderData.forFarming?.coins.tier}
            </div>
            <div>Cells</div>
            <div className="text-right">
              {loaderData.forFarming?.cells.tier}
            </div>
            <div>Reroll Shards</div>
            <div className="text-right">
              {loaderData.forFarming?.shards.tier}
            </div>
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  );
}
