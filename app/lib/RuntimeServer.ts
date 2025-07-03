import { Layer, ManagedRuntime } from "effect";
import { ClerkService } from "./services/ClerkService";
import { TowerRunService } from "./services/TowerRunService";

const MainLayer = Layer.mergeAll(ClerkService.Default, TowerRunService.Default);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
