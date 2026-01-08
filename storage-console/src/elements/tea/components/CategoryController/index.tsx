import type { TeaFormValues } from "../../controllers/teaSchema";
import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import CategorySelector from "../CategorySelector";

import styles from "./styles.module.css";

const CategoryController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="CategoryId"
      render={({ fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            所属分类和子分类 <span className={styles.required}>*</span>
          </label>
          <CategorySelector/>
          {error && <p className={styles.error}>{error.message}</p>}
          <p className={styles.hint}>💡 请先选择分类，然后选择子分类</p>
        </div>
      )}
    />
  );
});

CategoryController.displayName = "CategoryController";
export default CategoryController;
