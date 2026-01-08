import type { ReactNode } from "react";

import { memo } from "react";

import styles from "./styles.module.css";

export interface Activity {
  icon: ReactNode;
  text: string;
  time: string;
}

interface ActivityCardProps {
  title: string;
  activities: Activity[];
}

// 基础 ActivityCard 组件
const ActivityCard = memo(({ title, activities }: ActivityCardProps) => {
  return (
    <div className={styles.infoCard}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.activityList}>
        {activities.map((activity, index) => (
          <div key={index} className={styles.activityItem}>
            <div className={styles.activityIcon}>{activity.icon}</div>
            <div className={styles.activityContent}>
              <span className={styles.activityText}>{activity.text}</span>
              <span className={styles.activityTime}>{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ActivityCard.displayName = "ActivityCard";

export default ActivityCard;
