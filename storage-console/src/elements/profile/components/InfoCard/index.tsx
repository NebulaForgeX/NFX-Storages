import type { ReactNode } from "react";

import { memo } from "react";

import styles from "./styles.module.css";

export interface InfoItem {
  icon: ReactNode;
  label: string;
  value: string;
  status?: "active" | "inactive" | "warning";
}

interface InfoCardProps {
  title: string;
  items: InfoItem[];
}

// 基础 InfoCard 组件
const InfoCard = memo(({ title, items }: InfoCardProps) => {
  return (
    <div className={styles.infoCard}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.infoList}>
        {items.map((item, index) => (
          <div key={index} className={styles.infoItem}>
            <div className={styles.infoIcon}>{item.icon}</div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>{item.label}</span>
              <span
                className={`${styles.infoValue} ${
                  item.status ? styles[`status${item.status.charAt(0).toUpperCase()}${item.status.slice(1)}`] : ""
                }`}
              >
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

InfoCard.displayName = "InfoCard";

export default InfoCard;
