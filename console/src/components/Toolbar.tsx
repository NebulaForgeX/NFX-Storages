import type { ReactNode } from "react";

import { Box, Flex, TextField } from "@radix-ui/themes";

export interface ToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export function Toolbar({ search, onSearchChange, searchPlaceholder, children }: ToolbarProps) {
  return (
    <Box pb="3">
    <Flex gap="2" wrap="wrap" align="center">
      {onSearchChange ? (
        <TextField.Root
          value={search ?? ""}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          style={{ minWidth: 220 }}
        />
      ) : null}
      {children}
    </Flex>
    </Box>
  );
}
