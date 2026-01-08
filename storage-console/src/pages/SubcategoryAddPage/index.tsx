import { memo, useEffect } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { FormProvider } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInitSubcategoryForm, useSubmitSubcategory } from "@/elements/subCategory";

import { SubcategoryForm } from "./components";
import styles from "./styles.module.css";

const SubcategoryAddPage = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form setup
  const methods = useInitSubcategoryForm();
  const { onSubmit, onSubmitError, isPending } = useSubmitSubcategory();

  // 从 URL 参数获取父分类 ID 并自动填充
  useEffect(() => {
    const parentId = searchParams.get("parentId");
    if (parentId) {
      methods.setValue("ParentId", parentId);
    }
  }, [searchParams, methods]);

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
          <h1 className={styles.title}>创建新子分类</h1>
      </div>

      <div className={styles.content}>
          <div className={styles.rightColumn}>
            <SubcategoryForm onSubmit={onSubmit} onSubmitError={onSubmitError} isPending={isPending} />
          </div>
        </div>
      </div>
    </FormProvider>
  );
});

SubcategoryAddPage.displayName = "SubcategoryAddPage";

export default SubcategoryAddPage;

