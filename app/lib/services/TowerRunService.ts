import { Data, Effect } from "effect";
import { ConvexService } from "./ConvexService";
import type { Doc } from "convex/_generated/dataModel";
import { combatKeys } from "~/lib/runs/sections/combat";
import { camelCaseToLabel } from "~/lib/utils";
import type { ChartConfig } from "~/components/ui/chart";

export class TowerRunServiceError extends Data.TaggedError(
  "TowerRunServiceError"
)<{ cause?: unknown; message?: string }> {}

export class TowerRunService extends Effect.Service<TowerRunService>()(
  "TowerRunService",
  {
    effect: Effect.gen(function* () {
      const getDetails = Effect.fn("TowerRunService.getDetails")(function* (
        userId: string,
        runId: string
      ) {
        const convex = yield* ConvexService;
        const data = yield* convex.use((client, api) =>
          client.query(api.runs.getSingleFullInfo, { userId, runId })
        );

        if (!data) {
          return yield* new TowerRunServiceError({
            message: "No results.",
          });
        }

        return data;
      });

      const analyzeSingleRunDamageShare = Effect.fn(
        "TowerRunService.analyzeSingleRunDamageShare"
      )(function* (runValues: Doc<"runValues">) {
        const { text, values } = runValues.combat;
        const keys = combatKeys
          .filter((k) => k.endsWith("Damage"))
          .map((key) => ({ key, prefix: key.replace(/Damage$/, "") }));

        if (keys.length === 0)
          return yield* new TowerRunServiceError({
            message: `No Damage values found in combat keys: ${combatKeys.join(
              ","
            )}`,
          });

        const totalDamage = values.damageDealt;

        if (totalDamage <= 0)
          return yield* new TowerRunServiceError({
            message: `Invalid value for damage dealt: ${text.damageDealt}`,
          });

        const data = keys
          .map(({ key, prefix }) => {
            const rawDamage = values[key];
            const damagePercent = (rawDamage * 100) / totalDamage;
            const damage = Number(damagePercent.toFixed(2));

            return {
              from: prefix,
              damage,
              fill: `var(--color-${prefix})`,
            };
          })
          .toSorted((a, b) => b.damage - a.damage)
          .filter((d, i) => d.damage > 0.01 && i < 10);

        if (data.length === 0)
          return yield* new TowerRunServiceError({
            message: "No damage data sources found.",
          });

        const config = data.reduce(
          (p, c, i) => ({
            ...p,
            [c.from]: {
              label: camelCaseToLabel(c.from),
              color: `var(--chart-${i + 1})`,
            },
          }),
          {} as Record<string, { label: string; color: string }>
        ) satisfies ChartConfig;

        return { data, config };
      });

      return {
        getDetails,
        analyzeSingleRunDamageShare,
      };
    }),
  }
) {}
