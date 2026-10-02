import type { ReactNode } from "react";

import { Box, Container, Flex, Section, TextField } from "@radix-ui/themes";

import styles from "./s.module.css";

export interface ToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export function Toolbar({ search, onSearchChange, searchPlaceholder, children }: ToolbarProps) {
  return (
    <Box className={styles.bar}>
      <Section py="3">
        <Container px="3">
          <Flex gap="2" wrap="wrap" align="center">
            {onSearchChange ? (
              <TextField.Root className={styles.search} value={search ?? ""} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} />
            ) : null}
            {children}
          </Flex>
        </Container>
      </Section>
    </Box>
  );
}
