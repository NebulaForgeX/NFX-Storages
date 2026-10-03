import type { SystemShowErrorPayload, SystemShowLoadingPayload, SystemShowSuccessPayload } from "nfx-ui/events";

import { useEffect } from "react";
import { systemEventEmitter, systemEvents } from "nfx-ui/events";

import { hideLoading, showError, showLoading, showSuccess } from "@/stores/modal";

/** Package `systemEventEmitter` → host error/success modal. */
export function useSystemFeedbackInv() {
  useEffect(() => {
    const onError = (payload: SystemShowErrorPayload) => {
      showError(payload.message, payload.title);
    };
    const onSuccess = (payload: SystemShowSuccessPayload) => {
      showSuccess(payload);
    };
    const onLoading = (payload: SystemShowLoadingPayload) => {
      showLoading({ message: payload.message });
    };
    const onHideLoading = () => {
      hideLoading();
    };
    systemEventEmitter.on(systemEvents.SHOW_ERROR, onError);
    systemEventEmitter.on(systemEvents.SHOW_SUCCESS, onSuccess);
    systemEventEmitter.on(systemEvents.SHOW_LOADING, onLoading);
    systemEventEmitter.on(systemEvents.HIDE_LOADING, onHideLoading);
    return () => {
      systemEventEmitter.off(systemEvents.SHOW_ERROR, onError);
      systemEventEmitter.off(systemEvents.SHOW_SUCCESS, onSuccess);
      systemEventEmitter.off(systemEvents.SHOW_LOADING, onLoading);
      systemEventEmitter.off(systemEvents.HIDE_LOADING, onHideLoading);
    };
  }, []);
}
