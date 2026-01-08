import { memo } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface CategoryHeaderProps {
  categoryId: string | undefined;
}

const CategoryHeader = memo(({ categoryId }: CategoryHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (!categoryId) return;
    navigate(ROUTES.CATEGORY_EDIT.replace(":categoryId", categoryId));
  };

  return (
    <div className={styles.header}>
      <button onClick={handleBack} className={styles.backBtn}>
        <ArrowLeft size={20} />
      </button>
      <h1 className={styles.title}>分类详情</h1>
      <button onClick={handleEdit} className={styles.editBtn}>
        编辑分类
      </button>
    </div>
  );
});

CategoryHeader.displayName = "CategoryHeader";

export default CategoryHeader;

