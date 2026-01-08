import type { CategorySimple, SubcategorySimple } from "@/apis/domain";

import { memo } from "react";
import { FolderTree, Layers } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

interface CategoryInfoProps {
  category?: CategorySimple;
  subcategory?: SubcategorySimple;
}

const CategoryInfo = memo(({ category, subcategory }: CategoryInfoProps) => {
  return (
    <div className={styles.infoSection}>
      <h2 className={styles.sectionTitle}>分类信息</h2>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <FolderTree size={18} />
            <span>所属分类</span>
          </div>
          <div className={styles.infoValue}>{category?.name || "未设置"}</div>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <Layers size={18} />
            <span>所属子分类</span>
          </div>
          <div className={styles.infoValue}>{subcategory?.name || "未设置"}</div>
        </div>
      </div>
    </div>
  );
});

CategoryInfo.displayName = "CategoryInfo";

export default CategoryInfo;

