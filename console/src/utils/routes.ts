import { joinURL } from "ufo";

function getBaseURL(): string {
  return import.meta.env.BASE_URL || "/";
}

export function buildRoute(path: string): string {
  const baseURL = getBaseURL();
  return joinURL(baseURL.replace(/\/$/, ""), path.replace(/^\//, ""));
}

export function getLoginRoute(): string {
  return buildRoute("/auth/login");
}
