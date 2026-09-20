import { Check, Info, X, type LucideIcon as LucideGlyph } from "lucide-react";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { LucideIcon } from "@/components";
import { hideModal, useModalStore } from "@/stores/modal";

const TYPE_CONFIG: Record<string, { icon: LucideGlyph; color: "green" | "red" | "blue" }> = {
  success: { icon: Check, color: "green" },
  error: { icon: X, color: "red" },
  info: { icon: Info, color: "blue" },
};

const Base = () => {
  const variant = useModalStore((state) => state.baseModal.variant ?? state.modalType ?? "info");
  const isOpen = useModalStore((state) => state.baseModal.isOpen);
  const title = useModalStore((state) => state.baseModal.title);
  const message = useModalStore((state) => state.baseModal.message);
  const confirmText = useModalStore((state) => state.baseModal.confirmText);
  const onClick = useModalStore((state) => state.baseModal.onClick);

  const handleClose = () => {
    hideModal(variant);
    if (onClick) onClick();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleClose();
  };

  const config = TYPE_CONFIG[variant] ?? TYPE_CONFIG.info;

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="420px">
        <Flex direction="column" align="center" gap="3">
          <Text color={config.color}>
            <LucideIcon icon={config.icon} size={28} strokeWidth={1.8} />
          </Text>
          {title ? <Dialog.Title>{title}</Dialog.Title> : null}
          <Text as="p" align="center" color="gray" size="2">
            {message || "No message"}
          </Text>
          <Button onClick={handleClose} style={{ width: "100%" }}>
            <CheckIcon />
            {confirmText || "OK"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

Base.displayName = "Base";

export default Base;
