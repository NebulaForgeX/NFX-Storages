import { memo } from "react";
import { Eye, EyeOff, Hash, Tag } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

interface BasicInfoProps {
  name: string;
  keyValue: string;
  show?: boolean;
  description?: string;
}

const BasicInfo = memo(({ name, keyValue, show, description }: BasicInfoProps) => {
  return (
    <div className={styles.infoSection}>
      <h2 className={styles.sectionTitle}>基本信息</h2>
      
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <Tag size={18} />
            <span>子分类名称</span>
          </div>
          <div className={styles.infoValue}>{name}</div>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <Hash size={18} />
            <span>子分类标识</span>
          </div>
          <div className={styles.infoValue}>{keyValue}</div>
        </div>

        {show !== undefined && (
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              {show ? <Eye size={18} /> : <EyeOff size={18} />}
              <span>显示状态</span>
            </div>
            <div className={styles.infoValue}>
              <span className={`${styles.badge} ${show ? styles.show : styles.hide}`}>
                {show ? "显示" : "隐藏"}
              </span>
            </div>
          </div>
        )}
      </div>

      {description && (
        <div className={styles.descriptionItem}>
          <div className={styles.infoLabel}>
            <span>子分类描述</span>
          </div>
          <div className={styles.descriptionValue}>{description}</div>
        </div>
      )}
    </div>
  );
});

BasicInfo.displayName = "BasicInfo";

export default BasicInfo;

