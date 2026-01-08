import type { CategoryFormValues } from "../../controllers/categorySchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const NameController = memo(() => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CategoryFormValues>();

  return (
    <div className={styles.formControl}>
      <label className={styles.label}>
        分类名称 <span className={styles.required}>*</span>
      </label>
      <input
        {...register("Name")}
        type="text"
        placeholder="请输入分类名称"
        className={`${styles.input} ${errors.Name ? styles.inputError : ""}`}
        maxLength={50}
      />
      {errors.Name && <p className={styles.errorMessage}>{errors.Name.message}</p>}
    </div>
  );
});

NameController.displayName = "NameController";

export default NameController;

