import { memo } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useInitCategoryForm, useSubmitCategory } from "@/elements/category";

import { CategoryForm } from "./components";
import styles from "./styles.module.css";

const CategoryAddPage = memo(() => {
  const navigate = useNavigate();

  // Form setup
  const methods = useInitCategoryForm();
  const { onSubmit, onSubmitError, isPending } = useSubmitCategory();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <FormProvider {...methods}>
      <div className={styles.page}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>创建新分类</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.rightColumn}>
            <CategoryForm onSubmit={onSubmit} onSubmitError={onSubmitError} isPending={isPending} />
          </div>
        </div>
      </div>
    </FormProvider>
  );
});

CategoryAddPage.displayName = "CategoryAddPage";

export default CategoryAddPage;
