import { memo, useEffect, useRef, useCallback } from "react";
import { CheckCircle, Info, XCircle } from "@/assets/icons/lucide";

import ModalStore, { useModalStore } from "@/stores/modalStore";

import styles from "./Modal.module.css";


const BaseModal = memo(() => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const type = useModalStore((state) => state.modalType);
  const isOpen = useModalStore((state) => state.baseModal.isOpen);
  const title = useModalStore((state) => state.baseModal.title);
  const message = useModalStore((state) => state.baseModal.message);
  const confirmText = useModalStore((state) => state.baseModal.confirmText);
  const onClick = useModalStore((state) => state.baseModal.onClick);
  const hideModal = ModalStore.getState().hideModal;

  const handleClose = useCallback(() => {
    hideModal(type);
    if (onClick) onClick();
  }, [hideModal, type, onClick]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (type === "success") {
      const timer = setTimeout(() => {
        handleClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [type, handleClose]);

  const getIcon = useCallback(() => {
    switch (type) {
      case "success":
        return <CheckCircle size={32} />;
      case "error":
        return <XCircle size={32} />;
      default:
        return <Info size={32} />;
    }
  }, [type]);

  return (
    <dialog ref={dialogRef} className={styles.modal} onClose={handleClose}>
      <div className={`${styles.content} ${styles[type]}`}>
        <div className={styles.icon}>{getIcon()}</div>
        {title && <h3 className={styles.title}>{title}</h3>}
        <p className={styles.message}>{message || "No message"}</p>
        <button className={styles.closeButton} onClick={handleClose}>
          {confirmText || "OK"}
        </button>
      </div>
    </dialog>
  );
});

BaseModal.displayName = "BaseModal";

export default BaseModal;
