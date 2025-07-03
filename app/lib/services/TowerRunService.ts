import { Data, Effect } from "effect";
import { ConvexService } from "./ConvexService";

export class TowerRunServiceError extends Data.TaggedError(
  "TowerRunServiceError"
)<{ cause?: unknown; message?: string }> {}

export class TowerRunService extends Effect.Service<TowerRunService>()(
  "TowerRunService",
  {
    effect: Effect.gen(function* () {
      const convex = yield* ConvexService;

      const getDetails = Effect.fn("TowerRunService.getDetails")(function* (
        userId: string,
        runId: string
      ) {
        const data = yield* convex.use((client, api) =>
          Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
              try: () =>
                client.query(api.runs.getSingleFullInfo, { userId, runId }),
              catch: (e) => new TowerRunServiceError({ cause: e }),
            });

            if (!result)
              return yield* new TowerRunServiceError({
                message: "No results.",
              });

            return result;
          })
        );

        return data;
      });

      return {
        getDetails,
      };
    }),
    dependencies: [ConvexService.Default],
  }
) {}
