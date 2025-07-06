import { Data, Effect } from "effect";
import type { Doc } from "convex/_generated/dataModel";
import { combatKeys } from "~/lib/runs/sections/combat";
import { camelCaseToLabel } from "~/lib/utils";
import type { ChartConfig } from "~/components/ui/chart";

export class SingleRunAnalysisServiceError extends Data.TaggedError(
  "SingleRunAnalysisServiceError"
)<{ message?: string }> {}

export class SingleRunAnalysisService extends Effect.Service<SingleRunAnalysisService>()(
  "SingleRunAnalysisService",
  {
    effect: Effect.gen(function* () {
      const calculateDamageShare = Effect.fn(
        "SingleRunAnalysisService.calculateDamageShare"
      )(function* (runValues: Doc<"runValues">) {
        const { text, values } = runValues.combat;
        const keys = combatKeys
          .filter((k) => k.endsWith("Damage"))
          .map((key) => ({ key, prefix: key.replace(/Damage$/, "") }));

        if (keys.length === 0)
          return yield* new SingleRunAnalysisServiceError({
            message: `No Damage values found in combat keys: ${combatKeys.join(
              ","
            )}`,
          });

        const totalDamage = values.damageDealt;

        if (totalDamage <= 0)
          return yield* new SingleRunAnalysisServiceError({
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
          return yield* new SingleRunAnalysisServiceError({
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

      return { calculateDamageShare };
    }),
  }
) {}
