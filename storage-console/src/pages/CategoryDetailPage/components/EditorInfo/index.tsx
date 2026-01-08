import { memo } from "react";
import { Calendar, User } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

interface EditorInfoProps {
  editorName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

const EditorInfo = memo(({ editorName, createdAt, updatedAt, deletedAt }: EditorInfoProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.infoSection}>
      <h2 className={styles.sectionTitle}>编辑信息</h2>
      
      <div className={styles.infoGrid}>
        {editorName && (
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <User size={18} />
              <span>最后编辑者</span>
            </div>
            <div className={styles.infoValue}>
              {editorName}
            </div>
          </div>
        )}

        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <Calendar size={18} />
            <span>创建时间</span>
          </div>
          <div className={styles.infoValue}>{formatDate(createdAt)}</div>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <Calendar size={18} />
            <span>更新时间</span>
          </div>
          <div className={styles.infoValue}>{formatDate(updatedAt)}</div>
        </div>

        {deletedAt && (
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <Calendar size={18} />
              <span>删除时间</span>
            </div>
            <div className={styles.infoValue}>{formatDate(deletedAt)}</div>
          </div>
        )}
      </div>
    </div>
  );
});

EditorInfo.displayName = "EditorInfo";

export default EditorInfo;

