import type { ReactNode } from "react";

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { AnimatedIcon, type AnimatedIconComponent } from "nfx-ui/icons";

import styles from "./s.module.css";

export type PageHeaderProps = {
  icon: AnimatedIconComponent;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** panel = compact control-console title (default for workspace pages) */
  density?: "default" | "panel";
};

export default function PageHeader({ icon, title, description, actions, density = "panel" }: PageHeaderProps) {
  const isPanel = density === "panel";
  return (
    <Flex asChild align="start" justify="between" gap="4" wrap="wrap" mb="0" className={styles.wrap}>
      <header>
        <Flex align="center" gap={isPanel ? "4" : "5"} minWidth="0">
          <Flex
            align="center"
            justify="center"
            flexShrink="0"
            width={isPanel ? "32px" : "48px"}
            height={isPanel ? "32px" : "48px"}
            className={`${styles.pageIcon} ${isPanel ? styles.panelIcon : ""}`}
          >
            <AnimatedIcon icon={icon} size={isPanel ? 16 : 22} />
          </Flex>
          <Box minWidth="0">
            <Heading as="h1" size={isPanel ? "5" : "6"} mb={description ? "1" : "0"}>
              {title}
            </Heading>
            {description ? (
              <Text as="p" size="2" color="gray">
                {description}
              </Text>
            ) : null}
          </Box>
        </Flex>
        {actions ? (
          <Flex gap="3" wrap="wrap" align="center">
            {actions}
          </Flex>
        ) : null}
      </header>
    </Flex>
  );
}
