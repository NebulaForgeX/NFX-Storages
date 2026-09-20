import { InfoCircleIcon } from "nfx-ui/icons";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import LucideIcon from "@/components/LucideIcon";
import { hideModal, useModalStore } from "@/stores/modal";

const Confirm = () => {
  const isOpen = useModalStore((state) => state.confirmModal.isOpen);
  const title = useModalStore((state) => state.confirmModal.title);
  const message = useModalStore((state) => state.confirmModal.message);
  const confirmText = useModalStore((state) => state.confirmModal.confirmText);
  const cancelText = useModalStore((state) => state.confirmModal.cancelText);
  const onConfirm = useModalStore((state) => state.confirmModal.onConfirm);
  const onCancel = useModalStore((state) => state.confirmModal.onCancel);

  const close = () => hideModal("confirm");

  const handleCancel = () => {
    onCancel?.();
    close();
  };

  const handleConfirm = () => {
    onConfirm?.();
    close();
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <Dialog.Content maxWidth="420px">
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <LucideIcon icon={InfoCircleIcon} size={20} />
            <Dialog.Title mb="0">{title || "Confirm"}</Dialog.Title>
          </Flex>
          <Text as="p" color="gray" size="2">
            {message}
          </Text>
          <Flex gap="2" justify="end">
            <Button variant="outline" onClick={handleCancel}>
              {cancelText || "Cancel"}
            </Button>
            <Button color="red" onClick={handleConfirm}>
              {confirmText || "Confirm"}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

Confirm.displayName = "Confirm";

export default Confirm;
