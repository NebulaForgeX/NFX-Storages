import type { ReactNode } from "react";

import { memo } from "react";

import styles from "./styles.module.css";

export interface QuickAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions = memo(({ actions }: QuickActionsProps) => {
  return (
    <div className={styles.quickActions}>
      <h3 className={styles.sectionTitle}>Quick Actions</h3>
      <div className={styles.actionButtons}>
        {actions.map((action, index) => (
          <button key={index} className={styles.actionButton} onClick={action.onClick}>
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
});

QuickActions.displayName = "QuickActions";

export default QuickActions;
