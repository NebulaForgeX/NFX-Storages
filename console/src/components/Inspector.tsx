import type { ReactNode } from "react";

import { Box, Button, Flex, Heading, Table, Text } from "@radix-ui/themes";

export interface PropertyItem {
  label: string;
  value: ReactNode;
}

export function PropertyList({ items }: { items: PropertyItem[] }) {
  return (
    <Table.Root variant="surface" size="1">
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.label}>
            <Table.RowHeaderCell style={{ width: "36%", whiteSpace: "nowrap" }}>{item.label}</Table.RowHeaderCell>
            <Table.Cell>
              <Text size="2" style={{ wordBreak: "break-all" }}>
                {item.value ?? "-"}
              </Text>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export interface InspectorProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  closeLabel?: string;
}

export function Inspector({ title, onClose, children, actions, closeLabel = "Close" }: InspectorProps) {
  return (
    <Box
      width="360px"
      flexShrink="0"
      style={{ borderLeft: "1px solid var(--gray-a5)", maxHeight: "calc(100dvh - 160px)", overflowY: "auto" }}
    >
      <Box pl="4">
      <Box pb="3">
      <Flex align="start" justify="between" gap="2">
        <Heading as="h2" size="3">
          {title}
        </Heading>
        <Button size="1" variant="ghost" onClick={onClose}>
          {closeLabel}
        </Button>
      </Flex>
      </Box>
      {actions ? (
        <Box pb="3">
        <Flex gap="2" wrap="wrap">
          {actions}
        </Flex>
        </Box>
      ) : null}
      <Flex direction="column" gap="3">
        {children}
      </Flex>
      </Box>
    </Box>
  );
}
