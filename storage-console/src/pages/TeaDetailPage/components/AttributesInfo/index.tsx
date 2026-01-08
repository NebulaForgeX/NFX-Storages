import { memo, useMemo } from "react";
import { Box } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

interface AttributesInfoProps {
  attributes?: Record<string, unknown>;
}

const AttributesInfo = memo(({ attributes }: AttributesInfoProps) => {
  const entries = useMemo(() => {
    if (!attributes) return [];
    return Object.entries(attributes).map(([key, value]) => ({
      key,
      value: value === null || value === undefined ? "-" : String(value),
    }));
  }, [attributes]);

  if (!entries.length) return null;

  return (
    <div className={styles.infoSection}>
      <h2 className={styles.sectionTitle}>扩展属性</h2>
      <div className={styles.attributeRow}>
        <div className={styles.iconWrapper}>
          <Box size={18} />
        </div>
        <div className={styles.attributeList}>
          {entries.map(({ key, value }) => (
            <span className={styles.attributeChip} key={key}>
              <span className={styles.attributeKey}>{key}</span>
              <span className={styles.attributeValue}>{value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

AttributesInfo.displayName = "AttributesInfo";

export default AttributesInfo;


