import type { ReactNode } from "react";

import { BrowserRouter } from "react-router";

import { useRouterEvents } from "../BrowserRouterProvider/hooks/useRouterEvents";

export interface RouterProviderProps {
  children: ReactNode;
}

function RouterEventsHandler({ children }: { children: ReactNode }) {
  useRouterEvents();
  return <>{children}</>;
}

const basename = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "/";

export function RouterProvider({ children }: RouterProviderProps) {
  return (
    <BrowserRouter basename={basename}>
      <RouterEventsHandler>{children}</RouterEventsHandler>
    </BrowserRouter>
  );
}

export default RouterProvider;
