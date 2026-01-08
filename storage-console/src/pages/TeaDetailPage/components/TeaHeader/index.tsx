import { memo } from "react";
import { ArrowLeft, Edit } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface TeaHeaderProps {
  teaId: string | undefined;
}

const TeaHeader = memo(({ teaId }: TeaHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (teaId) {
      navigate(ROUTES.TEA_EDIT.replace(":teaId", teaId));
    }
  };

  return (
    <div className={styles.header}>
      <button onClick={handleBack} className={styles.backBtn}>
        <ArrowLeft size={20} />
      </button>
      <h1 className={styles.title}>茶叶详情</h1>
      <button onClick={handleEdit} className={styles.editBtn}>
        <Edit size={20} />
        <span>编辑</span>
      </button>
    </div>
  );
});

TeaHeader.displayName = "TeaHeader";

export default TeaHeader;

