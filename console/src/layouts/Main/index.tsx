import type { CSSProperties } from "react";

import { Box } from "@radix-ui/themes";
import { useLayoutStore } from "nfx-ui/stores";
import { Outlet } from "react-router";

import Asider from "@/layouts/Asider";
import Header from "@/layouts/Header";

import styles from "./s.module.css";

function Main() {
  const headerHeight = useLayoutStore((state) => state.headerHeight);

  return (
    <Box position="relative" minHeight="100%" className={styles.root}>
      <Header />
      <Asider />
      <Box asChild position="relative" minHeight="100vh" className={styles.page} style={{ paddingTop: headerHeight, "--app-header-height": `${headerHeight}px` } as CSSProperties}>
        <main>
          <Box className={styles.backgroundGlow} aria-hidden />
          <Box className={styles.backgroundDotGrid} aria-hidden />
          <Outlet />
        </main>
      </Box>
    </Box>
  );
}

export default Main;
