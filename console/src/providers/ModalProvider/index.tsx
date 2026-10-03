import type { ReactNode } from "react";

import { Base, Confirm } from "./components";
import Loading from "./components/Loading";
import { useSystemFeedbackInv } from "./hooks/useSystemFeedbackInv";

const ModalProvider = ({ children }: { children: ReactNode }) => {
  useSystemFeedbackInv();
  return (
    <>
      {children}
      <Base />
      <Confirm />
      <Loading />
    </>
  );
};

export default ModalProvider;
