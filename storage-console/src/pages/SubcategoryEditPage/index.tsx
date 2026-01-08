import { memo } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { FormProvider } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components";
import { ECGLoading } from "@/components";
import {
  DescriptionController,
  ImageController,
  KeyController,
  NameController,
  ParentCategoryController,
  ShowController,
  useEditSubcategory,
  useInitSubcategoryForm,
} from "@/elements/subCategory";
import { GetSubcategoryByIdAuth } from "@/apis/subcategory.api";
import { useQuery } from "@tanstack/react-query";

import styles from "./styles.module.css";

const SubcategoryEditPage = memo(() => {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();
  const navigate = useNavigate();

  const { data: subcategory, isLoading: isLoadingSubcategory } = useQuery({
    queryKey: ["subcategory", subcategoryId],
    queryFn: () => GetSubcategoryByIdAuth(subcategoryId || ""),
    enabled: !!subcategoryId,
  });

  // Form setup
  const methods = useInitSubcategoryForm(subcategory ?? null);
  const { onSubmit, onSubmitError, isPending } = useEditSubcategory(subcategoryId || "");

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoadingSubcategory) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <ECGLoading size="large" />
            <p className={styles.loadingText}>加载子分类中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subcategory) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2>子分类不存在</h2>
            <p>您要编辑的子分类不存在。</p>
            <button onClick={handleBack} className={styles.backBtnError}>
              返回子分类列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </button>

            <h1 className={styles.title}>编辑子分类 - {subcategory.name}</h1>
            <p className={styles.subtitle}>更新「{subcategory.name}」的信息</p>

        </div>

        <div className={styles.formContainer}>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit, onSubmitError)} className={styles.form}>
              {/* 父分类选择（全宽） */}
              <ParentCategoryController />
              
              <div className={styles.formGrid}>
                {/* 左侧：基本信息 */}
                <div className={styles.leftColumn}>
                  <NameController />
                  <KeyController />
                  <DescriptionController />
                </div>

                {/* 右侧：图片和设置 */}
                <div className={styles.rightColumn}>
                  <ImageController existingImageUrl={subcategory.image} />
                  <ShowController />
                </div>
              </div>

              <div className={styles.actions}>
                <Button type="submit" className={styles.saveButton} disabled={isPending}>
                  {isPending ? "更新中..." : "更新子分类"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
});

SubcategoryEditPage.displayName = "SubcategoryEditPage";

export default SubcategoryEditPage;

