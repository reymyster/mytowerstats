import type { Params } from "react-router";

export type BreadcrumbHandle = {
  breadcrumb: (match: { params: Params }) => string | React.ReactNode;
};
