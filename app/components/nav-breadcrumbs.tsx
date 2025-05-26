import { Fragment } from "react/jsx-runtime";
import { useMatches, Link } from "react-router";
import type { BreadcrumbHandle } from "~/types/breadcrumb";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function NavBreadcrumbs() {
  const matches = useMatches();

  const crumbs = matches
    .filter(
      (match): match is typeof match & { handle: BreadcrumbHandle } =>
        typeof match.handle === "object" &&
        match.handle !== null &&
        "breadcrumb" in match.handle
    )
    .map((match) => ({
      label: match.handle.breadcrumb({ params: match.params }),
      href: match.pathname,
    }));
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs[0].label !== "Home" && (
          <Fragment>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link to={{ pathname: "/" }}>Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </Fragment>
        )}
        {crumbs.map((crumb, idx) => (
          <Fragment key={idx}>
            <BreadcrumbItem>
              {idx < crumbs.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link to={{ pathname: crumb.href }}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {idx < crumbs.length - 1 && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
