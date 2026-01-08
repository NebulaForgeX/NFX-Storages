// 路由常量定义 - 只定义实际使用的路由
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  EDIT_PROFILE: "/profile/edit",
  ACCOUNT_SECURITY: "/profile/account-security",
  VIEW_PROFILE: "/profile/:userId",
  // Category routes
  CATEGORY_LIST: "/categories",
  CATEGORY_ADD: "/categories/add",
  CATEGORY_DETAIL: "/categories/:categoryId",
  CATEGORY_EDIT: "/categories/:categoryId/edit",
  // Subcategory routes
  SUBCATEGORY_LIST: "/subcategories",
  SUBCATEGORY_ADD: "/subcategories/add",
  SUBCATEGORY_DETAIL: "/subcategories/:subcategoryId",
  SUBCATEGORY_EDIT: "/subcategories/:subcategoryId/edit",
  // Category Panel
  CATEGORY_PANEL: "/category-panel",
  // Tea routes
  TEA_LIST: "/teas",
  TEA_ADD: "/teas/add",
  TEA_DETAIL: "/teas/:teaId",
  TEA_EDIT: "/teas/:teaId/edit",
} as const;

// 路由类型
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

// 工具函数
export const isActiveRoute = (currentPath: string, targetPath: RoutePath): boolean => {
  return currentPath === targetPath;
};

export const getRouteByKey = (key: RouteKey): RoutePath => {
  return ROUTES[key];
};
