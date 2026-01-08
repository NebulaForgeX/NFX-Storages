import { memo } from "react";
import { Eye, EyeOff, Filter } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

export interface ShowFilterValue {
  enabled: boolean;
  value: boolean | null; // null = 全部, true = 显示, false = 隐藏
}

interface ShowFilterProps {
  value: ShowFilterValue;
  onChange: (value: ShowFilterValue) => void;
}

const ShowFilter = memo(({ value, onChange }: ShowFilterProps) => {
  const handleToggleEnabled = () => {
    onChange({ ...value, enabled: !value.enabled });
  };

  const handleSelectShow = (show: boolean | null) => {
    onChange({ ...value, value: show });
  };

  return (
    <div className={styles.container}>
      {/* Toggle 开关 */}
      <div className={styles.toggleContainer}>
        <button
          type="button"
          className={`${styles.toggleButton} ${value.enabled ? styles.enabled : ""}`}
          onClick={handleToggleEnabled}
          aria-label={value.enabled ? "禁用显示过滤" : "启用显示过滤"}
        >
          <Filter size={16} />
          <span>{value.enabled ? "显示过滤已启用" : "显示过滤已禁用"}</span>
        </button>
      </div>

      {/* 过滤选项 */}
      {value.enabled && (
        <div className={styles.optionsContainer}>
          <button
            type="button"
            className={`${styles.option} ${value.value === null ? styles.active : ""}`}
            onClick={() => handleSelectShow(null)}
          >
            全部
          </button>
          <button
            type="button"
            className={`${styles.option} ${value.value === true ? styles.active : ""}`}
            onClick={() => handleSelectShow(true)}
          >
            <Eye size={16} />
            <span>显示</span>
          </button>
          <button
            type="button"
            className={`${styles.option} ${value.value === false ? styles.active : ""}`}
            onClick={() => handleSelectShow(false)}
          >
            <EyeOff size={16} />
            <span>隐藏</span>
          </button>
        </div>
      )}
    </div>
  );
});

ShowFilter.displayName = "ShowFilter";

export default ShowFilter;

