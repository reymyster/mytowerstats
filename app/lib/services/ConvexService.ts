import { Config, Data, Effect, Redacted } from "effect";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";

export class ConvexServiceError extends Data.TaggedError("ConvexServiceError")<{
  cause?: unknown;
  message?: string;
}> {}

type API = typeof api;

export class ConvexService extends Effect.Service<ConvexService>()(
  "ConvexService",
  {
    effect: Effect.gen(function* () {
      const convexUrl = yield* Config.redacted("VITE_CONVEX_URL");
      const client = yield* Effect.try({
        try: () => new ConvexHttpClient(Redacted.value(convexUrl)),
        catch: (e) => new ConvexServiceError({ cause: e }),
      });

      return {
        use: <R, E, D>(
          fn: (client: ConvexHttpClient, api: API) => Effect.Effect<R, E, D>
        ) => fn(client, api),
      };
    }),
  }
) {}
