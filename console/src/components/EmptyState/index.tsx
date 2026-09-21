import type { ReactNode } from "react";

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { AnimatedIcon, type AnimatedIconComponent } from "nfx-ui/icons";

export type EmptyStateProps = {
  icon?: AnimatedIconComponent;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box px="4">
      <Box py="9">
        <Flex direction="column" align="center" justify="center" gap="3">
      {icon ? (
        <Flex
          align="center"
          justify="center"
          width="56px"
          height="56px"
          style={{
            borderRadius: "var(--radius-5)",
            background: "color-mix(in oklab, var(--gray-11) 8%, transparent)",
            color: "var(--gray-10)",
          }}
        >
          <AnimatedIcon icon={icon} size={24} />
        </Flex>
      ) : null}
      <Heading as="h3" size="4" align="center">
        {title}
      </Heading>
      {description ? (
        <Text as="p" size="2" color="gray" align="center" style={{ maxWidth: "36ch" }}>
          {description}
        </Text>
      ) : null}
          {action}
        </Flex>
      </Box>
    </Box>
  );
}
