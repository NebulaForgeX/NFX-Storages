import type { FieldErrors } from "react-hook-form";
import type { CategoryFormValues } from "@/elements/category/controllers/categorySchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import {
  DescriptionController,
  ImageController,
  KeyController,
  NameController,
  ShowController,
} from "@/elements/category/components";

import styles from "./styles.module.css";

interface CategoryFormProps {
  onSubmit: (data: CategoryFormValues) => Promise<void>;
  onSubmitError: (errors: FieldErrors<CategoryFormValues>) => void;
  isPending: boolean;
  isEditMode?: boolean;
  existingImageUrl?: string;
}

const CategoryForm = memo(({ onSubmit, onSubmitError, isPending, isEditMode = false, existingImageUrl }: CategoryFormProps) => {
  const methods = useFormContext<CategoryFormValues>();

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>{isEditMode ? "编辑分类" : "分类详情"}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className={styles.form}
        >
          {/* Basic Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>基本信息</h3>
            <div className={styles.basicInfoGrid}>
              <div className={styles.leftColumn}>
                <NameController />
                <KeyController />
              </div>
              <div className={styles.rightColumn}>
                <DescriptionController />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>分类图片</h3>
            <ImageController existingImageUrl={existingImageUrl} />
          </div>

          {/* Settings */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>设置</h3>
            <ShowController />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.submitBtn}
              disabled={isPending}
              onClick={methods.handleSubmit(onSubmit, onSubmitError)}
            >
              {isPending
                ? isEditMode
                  ? "更新中..."
                  : "创建中..."
                : isEditMode
                  ? "更新分类"
                  : "创建分类"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

CategoryForm.displayName = "CategoryForm";

export default CategoryForm;

