import type { FormEvent, ReactNode } from "react";

import { Button, Dialog, Flex } from "@radix-ui/themes";

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  onSubmit?: () => void | Promise<void>;
  maxWidth?: string;
  footer?: ReactNode;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel,
  cancelLabel = "Cancel",
  submitting,
  onSubmit,
  maxWidth = "480px",
  footer,
}: FormDialogProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit?.();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth={maxWidth}>
        <form onSubmit={handleSubmit}>
          <Dialog.Title>{title}</Dialog.Title>
          {description ? <Dialog.Description mb="3">{description}</Dialog.Description> : null}
          <Flex direction="column" gap="3">
            {children}
          </Flex>
          {footer ?? (
            <Flex gap="2" justify="end" mt="4">
              <Dialog.Close>
                <Button type="button" variant="outline" disabled={submitting}>
                  {cancelLabel}
                </Button>
              </Dialog.Close>
              {onSubmit ? (
                <Button type="submit" disabled={submitting}>
                  {submitLabel ?? "Save"}
                </Button>
              ) : null}
            </Flex>
          )}
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
