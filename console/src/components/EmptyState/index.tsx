import type { ReactNode } from "react";

import { Container, Flex, Heading, Section, Text } from "@radix-ui/themes";
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
            <Flex align="center" justify="center" className={styles.icon}>
              <AnimatedIcon icon={icon} size={24} />
            </Flex>
          ) : null}
          <Heading as="h3" size="4" align="center">
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
