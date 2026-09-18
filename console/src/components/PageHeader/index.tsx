import type { LucideIcon as LucideIconType } from "lucide-react";
import type { ReactNode } from "react";

import { Box, Flex, Heading, Text } from "@radix-ui/themes";

import LucideIcon from "@/components/LucideIcon";

import styles from "./s.module.css";

export type PageHeaderProps = {
  icon: LucideIconType;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** panel = compact control-console title (default for workspace pages) */
  density?: "default" | "panel";
};

export default function PageHeader({ icon, title, description, actions, density = "panel" }: PageHeaderProps) {
  const isPanel = density === "panel";
  return (
    <Flex asChild align="start" justify="between" gap="3" wrap="wrap" mb={isPanel ? "3" : "5"}>
      <header>
        <Flex align="center" gap={isPanel ? "3" : "4"} minWidth="0">
          <Flex
            align="center"
            justify="center"
            flexShrink="0"
            width={isPanel ? "28px" : "48px"}
            height={isPanel ? "28px" : "48px"}
            className={`${styles.pageIcon} ${isPanel ? styles.panelIcon : ""}`}
          >
            <LucideIcon icon={icon} size={isPanel ? 15 : 22} />
          </Flex>
          <Box minWidth="0">
            <Heading as="h1" size={isPanel ? "4" : "6"} mb={description ? "1" : "0"}>
              {title}
            </Heading>
            {description ? (
              <Text as="p" size="1" color="gray">
                {description}
              </Text>
            ) : null}
          </Box>
        </Flex>
        {actions ? (
          <Flex gap="2" wrap="wrap" align="center">
            {actions}
          </Flex>
        ) : null}
      </header>
    </Flex>
  );
}
