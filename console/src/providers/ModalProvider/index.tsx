import type { ReactNode } from "react";

import { Base, Confirm } from "./components";
import { useSystemFeedbackInv } from "./hooks/useSystemFeedbackInv";

const ModalProvider = ({ children }: { children: ReactNode }) => {
  useSystemFeedbackInv();
  return (
    <>
      {children}
      <Base />
      <Confirm />
    </>
  );
};

export default ModalProvider;
