import type { ReactNode } from "react";

import { Flex, Heading, Section, Text } from "@radix-ui/themes";

import styles from "./s.module.css";

export interface CardHeaderProps {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}

function CardHeader({ icon, title, description }: CardHeaderProps) {
  return (
    <Section pb="4">
      <Flex gap="3" align="start">
        <Flex align="center" justify="center" className={styles.icon}>
          {icon}
        </Flex>
        <Flex direction="column" gap="1" flexGrow="1" minWidth="0">
          <Heading as="h3" size="4">
            {title}
          </Heading>
          {description ? (
            <Text as="p" size="2" color="gray">
              {description}
            </Text>
          ) : null}
        </Flex>
      </Flex>
    </Section>
  );
}

export default CardHeader;
