import { Layer, ManagedRuntime } from "effect";
import { ClerkService } from "./services/ClerkService";
import { ConvexService } from "./services/ConvexService";
import { TowerRunService } from "./services/TowerRunService";
import { SingleRunAnalysisService } from "./services/SingleRunAnalysisService";

const MainLayer = Layer.mergeAll(
  ClerkService.Default,
  ConvexService.Default,
  TowerRunService.Default,
  SingleRunAnalysisService.Default
);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
