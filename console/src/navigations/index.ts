import { createRouter, defineRouter } from "nfx-ui/navigations";
import type { RouteKey as RouteKeyGeneric, RoutePath as RoutePathGeneric } from "nfx-ui/navigations";

const routeMap = defineRouter({
  HOME: "/",
  LOGIN: "/login",
  LOGIN_GITHUB_CALLBACK: "/login/github/callback",
  SELECT_PROFILE: "/select-profile",
  CONFIG: "/config",
  BROWSER: "/browser",
  BUCKET_OBJECTS: "/browser/:bucket",
  BUCKET_SETTINGS: "/buckets/:key",
  ACCESS_KEYS: "/access-keys",
  POLICIES: "/policies",
  USERS: "/users",
  USER_GROUPS: "/user-groups",
  IMPORT_EXPORT: "/import-export",
  PERFORMANCE: "/performance",
  POOLS: "/pools",
  EVENTS: "/events",
  REPLICATION: "/replication",
  LIFECYCLE: "/lifecycle",
  TIERS: "/tiers",
  EVENTS_TARGET: "/events-target",
  SSE: "/sse",
  LICENSE: "/license",
  SETTINGS: "/user/settings",
});

const { ROUTES, matchRoute, isActiveRoute, getRouteByKey } = createRouter(routeMap);
type RouteKey = RouteKeyGeneric<typeof routeMap>;
type RoutePath = RoutePathGeneric<typeof routeMap>;

export { ROUTES, matchRoute, isActiveRoute, getRouteByKey, type RouteKey, type RoutePath };
