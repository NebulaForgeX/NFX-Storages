import { memo } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface SubcategoryHeaderProps {
  subcategoryId: string | undefined;
}

const SubcategoryHeader = memo(({ subcategoryId }: SubcategoryHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (!subcategoryId) return;
    navigate(ROUTES.SUBCATEGORY_EDIT.replace(":subcategoryId", subcategoryId));
  };

  return (
    <div className={styles.header}>
      <button onClick={handleBack} className={styles.backBtn}>
        <ArrowLeft size={20} />
      </button>
      <h1 className={styles.title}>子分类详情</h1>
      <button onClick={handleEdit} className={styles.editBtn}>
        编辑子分类
      </button>
    </div>
  );
});

SubcategoryHeader.displayName = "SubcategoryHeader";

export default SubcategoryHeader;

