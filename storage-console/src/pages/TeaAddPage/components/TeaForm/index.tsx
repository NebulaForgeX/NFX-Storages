import type { FieldErrors } from "react-hook-form";
import type { TeaFormValues } from "@/elements/tea/controllers/teaSchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import {
  NameController,
  DescriptionController,
  CategoryController,
  PriceController,
  StockController,
  ImagesController,
  ShowController,
  TagsController,
  StatusController,
  AttributesController,
  YearController,
  OriginController,
  TreeTypeController,
  FormTypeController,
  WeightController,
  BatchController,
  StorageController,
} from "@/elements/tea";

import styles from "./styles.module.css";

interface TeaFormProps {
  onSubmit: (data: TeaFormValues) => Promise<void>;
  onSubmitError: (errors: FieldErrors<TeaFormValues>) => void;
  isPending: boolean;
  isEditMode?: boolean;
}

const TeaForm = memo(({ onSubmit, onSubmitError, isPending, isEditMode = false }: TeaFormProps) => {
  const methods = useFormContext<TeaFormValues>();

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>{isEditMode ? "编辑茶叶" : "茶叶详情"}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className={styles.form}
        >
          {/* 基本信息 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>基本信息</h3>
            <div className={styles.basicInfoGrid}>
              <div className={styles.leftColumn}>
                <NameController />
                <PriceController />
                <StockController />
              </div>
              <div className={styles.rightColumn}>
                <DescriptionController />
              </div>
            </div>
          </div>

          {/* 分类信息 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>分类信息</h3>
            <CategoryController />
          </div>

          {/* 产地与规格 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>产地与规格</h3>
            <div className={styles.metaGrid}>
              <YearController />
              <OriginController />
              <TreeTypeController />
              <FormTypeController />
              <WeightController />
              <BatchController />
              <StorageController />
            </div>
          </div>

          {/* 状态与标签 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>状态与标签</h3>
            <div className={styles.statusAndTags}>
              <StatusController />
              <TagsController />
            </div>
          </div>

          {/* 扩展属性 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>扩展属性</h3>
            <AttributesController />
          </div>

          {/* 图片 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>茶叶图片</h3>
            <ImagesController />
          </div>

          {/* 设置 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>显示设置</h3>
            <ShowController />
          </div>

          {/* 提交按钮 */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.submitBtn}
              disabled={isPending}
              onClick={methods.handleSubmit(onSubmit, onSubmitError)}
            >
              {isPending ? (isEditMode ? "更新中..." : "创建中...") : isEditMode ? "更新茶叶" : "创建茶叶"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

TeaForm.displayName = "TeaForm";

export default TeaForm;

