import type { ReactNode } from "react";

import { Box, Container, Flex, Heading, Section, Text } from "@radix-ui/themes";
import { AnimatedIcon, type AnimatedIconComponent } from "nfx-ui/icons";

import styles from "./s.module.css";

export type EmptyStateProps = {
  icon?: AnimatedIconComponent;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Container px="4">
      <Section py="9">
        <Flex direction="column" align="center" justify="center" gap="3">
          {icon ? (
            <Box className={styles.icon}>
              <Flex align="center" justify="center" width="100%" height="100%">
                <AnimatedIcon icon={icon} size={24} />
              </Flex>
            </Box>
          ) : null}
          <Heading as="h3" size="4" align="center" style={{ fontFamily: "var(--heading-font-family)" }}>
            {title}
          </Heading>
          {description ? (
            <Text as="p" size="2" color="gray" align="center" className={styles.lede}>
              {description}
            </Text>
          ) : null}
          {action}
        </Flex>
      </Section>
    </Container>
  );
}
