import type { ReactNode } from "react";

import { BrowserRouter } from "react-router";

import { useRouterEvents } from "./useRouterEvents";

export interface RouterProviderProps {
  children: ReactNode;
}

function RouterEventsHandler({ children }: { children: ReactNode }) {
  useRouterEvents();
  return <>{children}</>;
}

export function RouterProvider({ children }: RouterProviderProps) {
  return (
    <BrowserRouter>
      <RouterEventsHandler>{children}</RouterEventsHandler>
    </BrowserRouter>
  );
}

export default RouterProvider;
