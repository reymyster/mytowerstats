import { Data, Effect } from "effect";
import { ConvexService } from "./ConvexService";
import { ClerkService } from "./ClerkService";
import { type LoaderFunctionArgs } from "react-router";

export class TowerRunServiceError extends Data.TaggedError(
  "TowerRunServiceError"
)<{ cause?: unknown; message?: string }> {}

export class TowerRunService extends Effect.Service<TowerRunService>()(
  "TowerRunService",
  {
    effect: Effect.gen(function* () {
      const convex = yield* ConvexService;
      const clerk = yield* ClerkService;

      const getDetails = Effect.fn("TowerRunService.getDetails")(function* <
        A extends LoaderFunctionArgs
      >(loaderArgs: A, runId: string) {
        const { userId } = yield* clerk.getUser(loaderArgs);

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
    dependencies: [ConvexService.Default, ClerkService.Default],
  }
) {}
