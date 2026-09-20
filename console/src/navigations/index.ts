import { createRouter, defineRouter } from "@/utils";

const routeMap = defineRouter({
  HOME: "/",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",

  USER: "/user",
  USER_OVERVIEW: "/user/overview",
  PROFILE: "/user/profile",
  USER_PROFILE_OVERVIEW: "/user/profile/overview",
  USER_PROFILE_EDIT: "/user/profile/edit",
  USER_PROFILE_IDENTITIES: "/user/profile/identities",
  USER_SETTINGS: "/user/settings",

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
});

const { ROUTES, matchRoute, isActiveRoute, buildPath } = createRouter(routeMap);

export type RouteKey = keyof typeof ROUTES;
export { ROUTES, matchRoute, isActiveRoute, buildPath };
