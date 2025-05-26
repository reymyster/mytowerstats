import type { Route } from "./+types/new";
import type { BreadcrumbHandle } from "~/types/breadcrumb";

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "New Run",
};

export default function NewRun() {
  return <div>New Run</div>;
}
