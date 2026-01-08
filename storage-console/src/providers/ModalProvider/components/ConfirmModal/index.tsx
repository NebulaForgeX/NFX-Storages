import { memo, useEffect, useRef, useCallback } from "react";
import { AlertCircle } from "@/assets/icons/lucide";

import ModalStore, { useModalStore } from "@/stores/modalStore";

import styles from "./Modal.module.css";


const ConfirmModal = memo(() => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = useModalStore((state) => state.confirmModal.isOpen);
  const type = useModalStore((state) => state.modalType);
  const title = useModalStore((state) => state.confirmModal.title);
  const message = useModalStore((state) => state.confirmModal.message);
  const confirmText = useModalStore((state) => state.confirmModal.confirmText);
  const cancelText = useModalStore((state) => state.confirmModal.cancelText);
  const hideModal = ModalStore.getState().hideModal;
  const onConfirm = ModalStore.getState().confirmModal.onConfirm;
  const onCancel = ModalStore.getState().confirmModal.onCancel;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    hideModal("confirm");
  }, [hideModal]);

  const handleConfirm = useCallback(() => {
    if (onConfirm) onConfirm();
    hideModal("confirm");
  }, [onConfirm, hideModal]);

  const handleCancel = useCallback(() => {
    if (onCancel) onCancel();
    hideModal("confirm");
  }, [onCancel, hideModal]);

  return (
    <dialog ref={dialogRef} className={styles.modal} onClose={handleClose}>
      <div className={`${styles.content} ${styles[type]}`}>
        <div className={styles.icon}><AlertCircle size={32} /></div>
        {title && <h3 className={styles.title}>{title}</h3>}
        <p className={styles.message}>{message || "No message"}</p>
          <div className={styles.buttonGroup}>
            <button className={styles.cancelButton} onClick={handleCancel}>
              {cancelText || "Cancel"}
            </button>
            <button className={styles.confirmButton} onClick={handleConfirm}>
              {confirmText || "Confirm"}
            </button>
          </div>
      </div>
    </dialog>
  );
});

ConfirmModal.displayName = "ConfirmModal";

export default ConfirmModal;
