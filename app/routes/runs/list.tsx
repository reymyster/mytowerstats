import type { Route } from "./+types/list";
import type { BreadcrumbHandle } from "~/types/breadcrumb";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { formatRelative } from "date-fns";
import {
  abbreviateNumber,
  textToStats,
  calcStats,
  type RoundStats,
} from "~/lib/stats";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "Runs",
};

export async function loader(args: Route.LoaderArgs) {
  const runs = await convex.query(api.runs.get, {});

  return { runs };
}

interface IRun {
  recorded: number;
  tier?: number;
  wave?: number;
  coinsPerHour?: number;
  cellsPerHour?: number;
  rerollShardsPerHour?: number;
}

function num(input: number | undefined): string | undefined {
  if (typeof input === "undefined") return undefined;

  return abbreviateNumber(input);
}

export default function ListRuns({ loaderData }: Route.ComponentProps) {
  const runs = (loaderData.runs as IRun[]).toSorted(
    (a, b) => b.recorded - a.recorded
  );

  return (
    <div className="p-4">
      <h2 className="text-lg">Runs</h2>
      <table className="border m-2">
        <thead>
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Recorded</th>
            <th className="border p-2">Tier</th>
            <th className="border p-2">Wave</th>
            <th className="border p-2">Coins/H</th>
            <th className="border p-2">Cells/H</th>
            <th className="border p-2">Reroll Shards/H</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run, i) => (
            <tr key={i}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">
                {formatRelative(new Date(run.recorded), new Date())}
              </td>
              <td className="border p-2 text-right">{run.tier}</td>
              <td className="border p-2 text-right">{run.wave}</td>
              <td className="border p-2 text-right">{num(run.coinsPerHour)}</td>
              <td className="border p-2 text-right">{num(run.cellsPerHour)}</td>
              <td className="border p-2 text-right">
                {num(run.rerollShardsPerHour)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
