import type { ReactNode } from "react";

import { Box, Container, Section, Button, Flex, Heading, Table, Text } from "@radix-ui/themes";

import styles from "./s.module.css";

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
            <Table.RowHeaderCell className={`${styles.labelWidth} ${styles.labelNowrap}`}>{item.label}</Table.RowHeaderCell>
            <Table.Cell>
              <Text size="2" className={styles.valueBreak}>
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
    <Box width="360px" className={`${styles.clipMax} ${styles.clipScroll} ${styles.edge}`}>
      <Container pl="4">
      <Section pb="3">
      <Flex align="start" justify="between" gap="2">
        <Heading as="h2" size="3">
          {title}
        </Heading>
        <Button size="1" variant="ghost" onClick={onClose}>
          {closeLabel}
        </Button>
      </Flex>
      </Section>
      {actions ? (
        <Section pb="3">
        <Flex gap="2" wrap="wrap">
          {actions}
        </Flex>
        </Section>
      ) : null}
      <Flex direction="column" gap="3">
        {children}
      </Flex>
      </Container>
    </Box>
  );
}
