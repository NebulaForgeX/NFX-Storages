import type { ReactNode } from "react";

import { Container, Flex } from "@radix-ui/themes";

import { safeStringable } from "@/utils";

import styles from "./s.module.css";

/** Wider than Radix Container size="4" (1136px) — fits sidebar layouts without huge side gutters. */
const PAGE_FRAME_DEFAULT_MAX_WIDTH_PX = 1440;

type PageFrameProps = {
  children: ReactNode;
  /** 额外类名，叠加在 frame 之上（页面自身的 flex / gap / padding 等）。 */
  className?: string;
  /** 最大宽度，数字按 px 处理；默认 1440px（覆盖 Container size="4" 的 1136px）。 */
  maxWidth?: number | string;
  /** 全高布局（聊天 / 社交等）：去掉垂直 padding，锁定视口高度，仅内部滚动。 */
  fullHeight?: boolean;
};

/**
 * 页面内容框：统一限制最大宽度并水平居中。
 * Centers page content and caps its max width.
 */
function PageFrame({ children, className, maxWidth = PAGE_FRAME_DEFAULT_MAX_WIDTH_PX, fullHeight }: PageFrameProps) {
  const resolvedMaxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
  const frameClass = [fullHeight ? styles.fullHeightFrame : "", safeStringable(className)].filter(Boolean).join(" ");

  return (
    <Container size="4" align="center" py={fullHeight ? "0" : "5"} width="100%" maxWidth={resolvedMaxWidth} className={frameClass || undefined}>
      {fullHeight ? (
        <Flex direction="column" flexGrow="1" minHeight="0" width="100%" height="100%" className={styles.fullHeightBody}>
          {children}
        </Flex>
      ) : (
        children
      )}
    </Container>
  );
}

export default PageFrame;
