import { memo } from "react";
import { Calendar, Globe, Leaf, Layers, Package, Tag, Box } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

interface MetaInfoProps {
  year: number;
  origin: string;
  treeType: string;
  form: string;
  weight: number;
  batch?: string;
  storage: string;
}

const MetaInfo = memo(({ year, origin, treeType, form, weight, batch, storage }: MetaInfoProps) => {
  const metaItems = [
    { label: "生产年份", value: `${year} 年`, icon: Calendar },
    { label: "产地", value: origin || "未填写", icon: Globe },
    { label: "树种类型", value: treeType || "未填写", icon: Leaf },
    { label: "茶叶形态", value: form || "未填写", icon: Layers },
    { label: "净重", value: `${weight} g`, icon: Package },
    { label: "批次信息", value: batch || "未填写", icon: Tag },
    { label: "仓储方式", value: storage || "未填写", icon: Box },
  ];

  return (
    <div className={styles.infoSection}>
      <h2 className={styles.sectionTitle}>产地与规格</h2>
      <div className={styles.infoGrid}>
        {metaItems.map(item => {
          const Icon = item.icon;
          return (
            <div className={styles.infoItem} key={item.label}>
              <div className={styles.infoLabel}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              <div className={styles.infoValue}>{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MetaInfo.displayName = "MetaInfo";

export default MetaInfo;


