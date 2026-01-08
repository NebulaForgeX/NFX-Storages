import { memo } from "react";

import styles from "./styles.module.css";

interface ECGLoadingProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const ECGLoading = memo(({ size = "medium", className }: ECGLoadingProps) => {
  const sizeMap = {
    small: { width: "48px", height: "36px" },
    medium: { width: "64px", height: "48px" },
    large: { width: "96px", height: "72px" },
  };

  const { width, height } = sizeMap[size];

  return (
    <div className={`${styles.loading} ${className || ""}`}>
      <svg width={width} height={height} viewBox="0 0 64 48">
        <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back" className={styles.back} />
        <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front" className={styles.front} />
      </svg>
    </div>
  );
});

ECGLoading.displayName = "ECGLoading";

export default ECGLoading;
