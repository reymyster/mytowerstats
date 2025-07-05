import { Layer, ManagedRuntime } from "effect";
import { ClerkService } from "./services/ClerkService";
import { ConvexService } from "./services/ConvexService";
import { TowerRunService } from "./services/TowerRunService";

const MainLayer = Layer.mergeAll(
  ClerkService.Default,
  ConvexService.Default,
  TowerRunService.Default
);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
