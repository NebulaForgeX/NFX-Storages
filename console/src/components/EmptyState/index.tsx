import type { LucideIcon as LucideIconType } from "lucide-react";
import type { ReactNode } from "react";

import { Flex, Heading, Text } from "@radix-ui/themes";

import LucideIcon from "@/components/LucideIcon";

export type EmptyStateProps = {
  icon?: LucideIconType;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Flex direction="column" align="center" justify="center" gap="3" py="9" px="4">
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
          <LucideIcon icon={icon} size={24} />
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
  );
}
