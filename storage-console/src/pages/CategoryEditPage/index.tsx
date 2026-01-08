import { memo } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { FormProvider } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { Button, Suspense } from "@/components";
import {
  DescriptionController,
  ImageController,
  KeyController,
  NameController,
  ShowController,
  useEditCategory,
  useInitCategoryForm,
} from "@/elements/category";
import { useCategory } from "@/hooks/useCategory";

import styles from "./styles.module.css";

// 内部组件：实际渲染编辑表单
const CategoryEditContent = memo(() => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  // Suspense 模式下，categoryId 必须存在（由父组件保证）
  const { data: category } = useCategory(
    ["category", categoryId],
    { id: categoryId! },
  );

  // Form setup
  // Suspense 模式下，category 一定存在
  const methods = useInitCategoryForm(category);
  const { onSubmit, onSubmitError, isPending } = useEditCategory(categoryId!);

  const handleBack = () => {
    navigate(-1);
  };

  // Suspense 模式下，category 一定存在，无需检查
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </button>

            <h1 className={styles.title}>编辑分类 - {category.name}</h1>
            <p className={styles.subtitle}>更新「{category.name}」的信息</p>

        </div>

        <div className={styles.formContainer}>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit, onSubmitError)} className={styles.form}>
              <div className={styles.formGrid}>
                {/* 左侧：基本信息 */}
                <div className={styles.leftColumn}>
                  <NameController />
                  <KeyController />
                  <DescriptionController />
                </div>

                {/* 右侧：图片和设置 */}
                <div className={styles.rightColumn}>
                  <ImageController existingImageUrl={category.image} />
                  <ShowController />
                </div>
              </div>

              <div className={styles.actions}>
                <Button type="submit" className={styles.saveButton} disabled={isPending}>
                  {isPending ? "更新中..." : "更新分类"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
});

CategoryEditContent.displayName = "CategoryEditContent";

// 主组件：使用 Suspense 包装
const CategoryEditPage = memo(() => {
  const { categoryId } = useParams<{ categoryId: string }>();

  if (!categoryId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2>分类 ID 无效</h2>
            <p>请从分类列表中选择要编辑的分类。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      loadingType="ecg"
      loadingText="加载分类中..."
      loadingSize="large"
    >
      <CategoryEditContent />
    </Suspense>
  );
});

CategoryEditPage.displayName = "CategoryEditPage";

export default CategoryEditPage;

