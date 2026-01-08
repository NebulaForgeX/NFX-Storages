import type { FieldErrors } from "react-hook-form";
import type { SubcategoryFormValues } from "@/elements/subCategory/controllers/subcategorySchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import {
  DescriptionController,
  ImageController,
  KeyController,
  NameController,
  ParentCategoryController,
  ShowController,
} from "@/elements/subCategory/components";

import styles from "./styles.module.css";

interface SubcategoryFormProps {
  onSubmit: (data: SubcategoryFormValues) => Promise<void>;
  onSubmitError: (errors: FieldErrors<SubcategoryFormValues>) => void;
  isPending: boolean;
  isEditMode?: boolean;
  existingImageUrl?: string;
}

const SubcategoryForm = memo(({ onSubmit, onSubmitError, isPending, isEditMode = false, existingImageUrl }: SubcategoryFormProps) => {
  const methods = useFormContext<SubcategoryFormValues>();

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>{isEditMode ? "编辑子分类" : "子分类详情"}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className={styles.form}
        >
          {/* Parent Category */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>父分类选择</h3>
            <ParentCategoryController />
          </div>

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
            <h3 className={styles.sectionTitle}>子分类图片</h3>
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
                  ? "更新子分类"
                  : "创建子分类"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

SubcategoryForm.displayName = "SubcategoryForm";

export default SubcategoryForm;

