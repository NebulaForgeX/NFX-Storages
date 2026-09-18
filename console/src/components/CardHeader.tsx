import type { ReactNode } from "react";

import { Flex, Heading, Text } from "@radix-ui/themes";

export interface CardHeaderProps {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}

function CardHeader({ icon, title, description }: CardHeaderProps) {
  return (
    <Flex gap="3" align="start" mb="4">
      <Flex
        align="center"
        justify="center"
        flexShrink="0"
        width="40px"
        height="40px"
        style={{
          borderRadius: "var(--radius-icon)",
          background: "color-mix(in oklab, var(--accent-9) 12%, transparent)",
          color: "var(--accent-9)",
        }}
      >
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
  );
}

export default CardHeader;
