import { useState } from "react";

import { Box, Button, Code, Dialog, Flex, Text } from "@radix-ui/themes";

export interface SecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: Array<{ label: string; value: string }>;
}

export function SecretDialog({ open, onOpenChange, title, description, fields }: SecretDialogProps) {
  const [copied, setCopied] = useState("");

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description mb="3">
          {description ?? "This secret is shown only once. Copy it now."}
        </Dialog.Description>
        <Flex direction="column" gap="3">
          {fields.map((field) => (
            <Flex key={field.label} direction="column" gap="1">
              <Text size="2" color="gray">
                {field.label}
              </Text>
              <Flex gap="2" align="center">
                <Code style={{ flex: 1, wordBreak: "break-all" }}>{field.value || "-"}</Code>
                {field.value ? (
                  <Button size="1" variant="outline" type="button" onClick={() => void copy(field.value, field.label)}>
                    {copied === field.label ? "Copied" : "Copy"}
                  </Button>
                ) : null}
              </Flex>
            </Flex>
          ))}
        </Flex>
        <Box pt="4">
        <Flex justify="end">
          <Dialog.Close>
            <Button>Close</Button>
          </Dialog.Close>
        </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}
