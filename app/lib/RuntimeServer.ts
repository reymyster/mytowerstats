import { Layer, ManagedRuntime } from "effect";
import { TowerRunService } from "./services/TowerRunService";

const MainLayer = Layer.mergeAll(TowerRunService.Default);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
