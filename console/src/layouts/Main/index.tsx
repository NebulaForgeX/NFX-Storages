import type { CSSProperties } from "react";

import { Box } from "@radix-ui/themes";
import { useLayoutStore } from "nfx-ui/stores";
import { Outlet } from "react-router";

import Header from "@/layouts/Header";

function Main() {
  const headerHeight = useLayoutStore((state) => state.headerHeight);

  return (
    <Box position="relative" minHeight="100dvh" style={{ background: "var(--color-background)" }}>
      <Header />
      <Box
        asChild
        position="relative"
        minHeight="100dvh"
        style={
          {
            paddingTop: 0,
            "--app-header-height": `${headerHeight}px`,
          } as CSSProperties
        }
      >
        <main>
          <Outlet />
        </main>
      </Box>
    </Box>
  );
}

export default Main;
