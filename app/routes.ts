import {
  type RouteConfig,
  index,
  route,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  layout("layouts/public-layout.tsx", [
    index("routes/home.tsx"),
    route("sign-in/*", "routes/sign-in.tsx"),
    route("sign-up/*", "routes/sign-up.tsx"),
  ]),
  layout("layouts/authed-layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    ...prefix("runs", [route("new", "routes/runs/new.tsx")]),
  ]),
] satisfies RouteConfig;
