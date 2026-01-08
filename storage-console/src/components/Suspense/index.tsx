import type { ReactNode, SuspenseProps as ReactSuspenseProps } from "react";
import { memo, Suspense as ReactSuspense, useCallback } from "react";
import { QueryErrorResetBoundary, type QueryErrorResetBoundaryProps } from "@tanstack/react-query";

import { ECGLoading, TruckLoading } from "@/components";

import styles from "./styles.module.css";
import SuspenseErrorBoundary from "./SuspenseErrorBoundary";

interface SuspenseProps extends Omit<ReactSuspenseProps, "fallback">, Omit<QueryErrorResetBoundaryProps, "children"> {
  fallback?: ReactNode;
  test?: boolean;
  loadingType?: "ecg" | "truck";
  loadingText?: string;
  loadingSize?: "small" | "medium" | "large";
  loadingContainerClassName?: string;
  loadingTextClassName?: string;
  loadingClassName?: string;
  errorFallback?: (args: { error: Error | null; retry: () => void }) => ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  retryText?: string;
  errorContainerClassName?: string;
  errorDetailsClassName?: string;
  showErrorDetails?: boolean;
}

const Suspense = memo((props: SuspenseProps) => {
  const {
    fallback,
    test,
    loadingType = "ecg",
    loadingClassName,
    loadingText,
    loadingSize = "medium",
    loadingContainerClassName,
    loadingTextClassName,
    children,
    errorFallback,
    errorTitle = "加载失败",
    errorDescription = "请检查网络连接或稍后重试。",
    retryText = "重试",
    errorContainerClassName,
    errorDetailsClassName,
    showErrorDetails = import.meta.env.DEV,
    ...restProps
  } = props;
  const renderLoading = useCallback(() => {
    switch (loadingType) {
      case "ecg":
        return <ECGLoading size={loadingSize} className={loadingClassName} />;
      case "truck":
        return <TruckLoading size={loadingSize} className={loadingClassName} />;
      default:
        return <ECGLoading size={loadingSize} className={loadingClassName} />;
    }
  }, [loadingType, loadingSize, loadingClassName]);

  const renderFallback = useCallback(() => {
    if (fallback) {
      return fallback;
    }
    return (
      <div className={`${styles.loadingContainer} ${loadingContainerClassName || ""}`}>
        {renderLoading()}
        <p className={`${styles.loadingText} ${loadingTextClassName || ""}`}>{loadingText || "Loading..."}</p>
      </div>
    );
  }, [fallback, loadingContainerClassName, loadingText, loadingTextClassName, renderLoading]);

  const renderErrorFallback = useCallback(
    (error: Error | null, retry: () => void) => {
      if (errorFallback) return errorFallback({ error, retry });

      return (
        <div className={`${styles.errorContainer} ${errorContainerClassName || ""}`}>
          <h3 className={styles.errorTitle}>{errorTitle}</h3>
          <p className={styles.errorDescription}>{errorDescription}</p>
          {showErrorDetails && error && (
            <pre className={`${styles.errorDetails} ${errorDetailsClassName || ""}`}>{error.message}</pre>
          )}
          <button type="button" className={styles.retryButton} onClick={retry}>
            {retryText}
          </button>
        </div>
      );
    },
    [
      errorFallback,
      errorContainerClassName,
      errorDescription,
      errorTitle,
      retryText,
      showErrorDetails,
      errorDetailsClassName,
    ],
  );

  return (
    <QueryErrorResetBoundary {...restProps}>
      {({ reset }) => (
        <SuspenseErrorBoundary
          onReset={reset}
          fallbackRender={({ error, retry }) => renderErrorFallback(error, retry)}
        >
          <ReactSuspense fallback={renderFallback()} {...restProps}>
            {test ? <AlwaysPending /> : children}
          </ReactSuspense>
        </SuspenseErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
});

Suspense.displayName = "Suspense";
export default Suspense;

const AlwaysPending = () => {
  throw new Promise(() => {}); // 永不 resolve 的 Promise
};
