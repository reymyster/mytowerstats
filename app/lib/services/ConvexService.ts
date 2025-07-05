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
      const use = function* <R>(
        fn: (client: ConvexHttpClient, api: API) => Promise<R>
      ) {
        const convexUrl = yield* Config.redacted("VITE_CONVEX_URL");
        const client = yield* Effect.try({
          try: () => new ConvexHttpClient(Redacted.value(convexUrl)),
          catch: (e) =>
            new ConvexServiceError({
              cause: e,
              message: "Error initiating Convex client.",
            }),
        });

        const result = yield* Effect.tryPromise({
          try: () => fn(client, api),
          catch: (e) =>
            new ConvexServiceError({
              cause: e,
              message: "Error running Convex query.",
            }),
        });

        return result;
      };

      return { use };
    }),
  }
) {}
