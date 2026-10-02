import type { SystemShowErrorPayload, SystemShowSuccessPayload } from "nfx-ui/events";

import { useEffect } from "react";
import { systemEventEmitter, systemEvents } from "nfx-ui/events";

import { showError, showSuccess } from "@/stores/modal";

/** Package `systemEventEmitter` → host error/success modal. */
export function useSystemFeedbackInv() {
  useEffect(() => {
    const onError = (payload: SystemShowErrorPayload) => {
      showError(payload.message, payload.title);
    };
    const onSuccess = (payload: SystemShowSuccessPayload) => {
      showSuccess(payload);
    };
    systemEventEmitter.on(systemEvents.SHOW_ERROR, onError);
    systemEventEmitter.on(systemEvents.SHOW_SUCCESS, onSuccess);
    return () => {
      systemEventEmitter.off(systemEvents.SHOW_ERROR, onError);
      systemEventEmitter.off(systemEvents.SHOW_SUCCESS, onSuccess);
    };
  }, []);
}
