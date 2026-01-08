import type { CategorySimple } from "@/apis/domain";

import { memo } from "react";
import { ArrowRight, Package } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface ParentCategoryInfoProps {
  parentCategory?: CategorySimple;
}

const ParentCategoryInfo = memo(({ parentCategory }: ParentCategoryInfoProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (parentCategory) {
      navigate(ROUTES.CATEGORY_DETAIL.replace(":categoryId", parentCategory.id));
    }
  };

  return (
    <div className={styles.parentSection}>
      <h2 className={styles.sectionTitle}>所属分类</h2>
      
      {parentCategory ? (
        <div className={styles.parentCard} onClick={handleClick}>
          <div className={styles.parentInfo}>
            <Package size={24} className={styles.parentIcon} />
            <div>
              <h3 className={styles.parentName}>{parentCategory.name}</h3>
              <p className={styles.parentHint}>点击查看分类详情</p>
            </div>
          </div>
          <ArrowRight size={20} className={styles.arrowIcon} />
        </div>
      ) : (
        <div className={styles.emptyParent}>
          <p>暂无父分类信息</p>
        </div>
      )}
    </div>
  );
});

ParentCategoryInfo.displayName = "ParentCategoryInfo";

export default ParentCategoryInfo;

