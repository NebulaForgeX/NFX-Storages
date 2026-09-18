import type { ReactNode } from "react";

import { Base } from "./components";
import { useSystemFeedbackInv } from "./hooks/useSystemFeedbackInv";

const ModalProvider = ({ children }: { children: ReactNode }) => {
  useSystemFeedbackInv();
  return (
    <>
      {children}
      <Base />
    </>
  );
};

export default ModalProvider;
