import type { ReactNode } from "react";

import { Container, Flex } from "@radix-ui/themes";

import { safeStringable } from "@/utils";

import styles from "./s.module.css";

/** Wider than Radix Container size="4" (1136px) — fits sidebar layouts without huge side gutters. */
const PAGE_FRAME_DEFAULT_MAX_WIDTH_PX = 1440;

type PageFrameProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: number | string;
  fullHeight?: boolean;
};

function PageFrame({ children, className, maxWidth = PAGE_FRAME_DEFAULT_MAX_WIDTH_PX, fullHeight }: PageFrameProps) {
  const resolvedMaxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
  const frameClass = [fullHeight ? styles.fullHeightFrame : "", safeStringable(className)].filter(Boolean).join(" ");

  return (
    <Container size="4" align="center" px="6" py={fullHeight ? "0" : "7"} width="100%" maxWidth={resolvedMaxWidth} className={frameClass || undefined}>
      {fullHeight ? (
        <div className={styles.fullHeightBody}>{children}</div>
      ) : (
        <Flex direction="column" gap="7" width="100%" className={styles.stack}>
          {children}
        </Flex>
      )}
    </Container>
  );
}

export default PageFrame;
