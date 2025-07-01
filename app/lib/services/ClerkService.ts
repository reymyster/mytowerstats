import { Data, Effect } from "effect";
import { type LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";

export class ClerkServiceError extends Data.TaggedError("ClerkServiceError")<{
  cause?: unknown;
  message?: string;
}> {}

export class ClerkService extends Effect.Service<ClerkService>()(
  "ClerkService",
  {
    effect: Effect.gen(function* () {
      const getUser = Effect.fn("ClerkService.getUserId")(function* <
        A extends LoaderFunctionArgs
      >(args: A) {
        const user = yield* Effect.tryPromise({
          try: () => getAuth(args),
          catch: (e) => new ClerkServiceError({ cause: e }),
        });

        if (!user || !user.userId)
          return yield* new ClerkServiceError({
            message: "User not authenticated.",
          });

        return user;
      });

      return {
        getUser,
      };
    }),
  }
) {}
