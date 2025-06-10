import { allLabelsToKeys } from "./all-labels-map";

// sorting by label length
export const sortedLabels = Object.keys(allLabelsToKeys).toSorted(
  (a, b) => b.length - a.length
);
