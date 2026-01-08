import type { CategoryFormValues } from "../../controllers/categorySchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const KeyController = memo(() => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CategoryFormValues>();

  return (
    <div className={styles.formControl}>
      <label className={styles.label}>
        分类键值 <span className={styles.required}>*</span>
      </label>
      <input
        {...register("Key")}
        type="text"
        placeholder="请输入分类键值（如：electronics）"
        className={`${styles.input} ${errors.Key ? styles.inputError : ""}`}
        maxLength={50}
      />
      {errors.Key && <p className={styles.errorMessage}>{errors.Key.message}</p>}
      <p className={styles.hint}>💡 键值用于系统内部标识，建议使用英文小写字母和下划线</p>
    </div>
  );
});

KeyController.displayName = "KeyController";

export default KeyController;

