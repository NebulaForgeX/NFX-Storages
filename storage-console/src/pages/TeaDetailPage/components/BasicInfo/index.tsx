import type { TeaStatusEnum } from "@/apis/types/enums";

import { memo } from "react";
import { Tag, Eye, EyeOff, TrendingUp, CheckCircle } from "@/assets/icons/lucide";

import { TeaStatusLabelMap } from "@/apis/types/enums";

import styles from "./styles.module.css";

interface BasicInfoProps {
  name: string;
  description: string;
  show: boolean;
  views: number;
  status: TeaStatusEnum;
}

const BasicInfo = memo(({ name, description, show, views, status }: BasicInfoProps) => {
  return (
    <div className={styles.infoSection}>
      <h2 className={styles.sectionTitle}>基本信息</h2>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <Tag size={18} />
            <span>茶叶名称</span>
          </div>
          <div className={styles.infoValue}>{name}</div>
        </div>

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

        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <TrendingUp size={18} />
            <span>浏览次数</span>
          </div>
          <div className={styles.infoValue}>{views} 次</div>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <CheckCircle size={18} />
            <span>业务状态</span>
          </div>
          <div className={styles.infoValue}>{TeaStatusLabelMap[status]}</div>
        </div>
      </div>

      {description && (
        <div className={styles.descriptionItem}>
          <div className={styles.infoLabel}>
            <span>茶叶描述</span>
          </div>
          <div className={styles.descriptionValue}>{description}</div>
        </div>
      )}
    </div>
  );
});

BasicInfo.displayName = "BasicInfo";

export default BasicInfo;

