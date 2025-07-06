import { Data, Effect } from "effect";
import { ConvexService } from "./ConvexService";

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

      const getRecentList = Effect.fn("TowerRunService.getRecentList")(
        function* (userId: string) {
          const convex = yield* ConvexService;
          const data = yield* convex.use((client, api) =>
            client.query(api.runs.getRecentList, { userId })
          );

          return data;
        }
      );

      return {
        getDetails,
        getRecentList,
      };
    }),
  }
) {}
