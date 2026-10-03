import { Dialog, Flex, Spinner, Text } from "@radix-ui/themes";

import { useModalStore } from "@/stores/modal";

export default function Loading() {
  const isOpen = useModalStore((state) => state.loadingModal.isOpen);
  const message = useModalStore((state) => state.loadingModal.message);
  const title = useModalStore((state) => state.loadingModal.title);

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Content maxWidth="360px">
        <Flex direction="column" align="center" gap="3">
          <Spinner size="3" />
          {title ? <Dialog.Title>{title}</Dialog.Title> : null}
          {message ? (
            <Text as="p" align="center" color="gray" size="2">
              {message}
            </Text>
          ) : null}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
