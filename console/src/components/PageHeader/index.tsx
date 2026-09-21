import type { ReactNode } from "react";

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { AnimatedIcon, type AnimatedIconComponent } from "nfx-ui/icons";

import styles from "./s.module.css";

export type PageHeaderProps = {
  icon: AnimatedIconComponent;
  title: string;
  description?: string;
  actions?: ReactNode;
  index?: string;
  density?: "default" | "panel";
};

export default function PageHeader({ icon, title, description, actions, index, density = "panel" }: PageHeaderProps) {
  const compact = density === "panel";
  return (
    <Box className={styles.hairline} width="100%">
      <Box pb="5">
        <Flex asChild align="start" justify="between" gap="4" wrap="wrap">
          <header>
            <Flex align="start" gap="4" minWidth="0">
              <Flex align="center" justify="center" flexShrink="0" className={styles.stamp}>
                <AnimatedIcon icon={icon} size={compact ? 15 : 18} />
              </Flex>
              <Flex direction="column" gap="2" minWidth="0" className={styles.copy}>
                {index ? (
                  <Text as="span" className={styles.index}>
                    {index}
                  </Text>
                ) : null}
                <Heading as="h1" size={compact ? "7" : "8"} className={styles.title}>
                  {title}
                </Heading>
                {description ? (
                  <Text as="p" size="2" className={styles.lede}>
                    {description}
                  </Text>
                ) : null}
              </Flex>
            </Flex>
            {actions ? (
              <Flex gap="2" wrap="wrap" align="center" className={styles.actions}>
                {actions}
              </Flex>
            ) : null}
          </header>
        </Flex>
      </Box>
    </Box>
  );
}
