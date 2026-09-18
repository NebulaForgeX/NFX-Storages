import type { ReactNode } from "react";

import { Suspense as ReactSuspense } from "react";
import { Flex, Spinner, Text } from "@radix-ui/themes";

export type SuspenseProps = {
  children: ReactNode;
  loadingText?: string;
};

export default function Suspense({ children, loadingText = "Loading" }: SuspenseProps) {
  return (
    <ReactSuspense
      fallback={
        <Flex align="center" justify="center" gap="3" p="6" minHeight="200px">
          <Spinner />
          <Text size="2" color="gray">
            {loadingText}
          </Text>
        </Flex>
      }
    >
      {children}
    </ReactSuspense>
  );
}
