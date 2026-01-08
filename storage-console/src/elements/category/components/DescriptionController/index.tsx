import type { CategoryFormValues } from "../../controllers/categorySchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const DescriptionController = memo(() => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CategoryFormValues>();

  return (
    <div className={styles.formControl}>
      <label className={styles.label}>分类描述</label>
      <textarea
        {...register("Description")}
        placeholder="请输入分类描述"
        className={`${styles.textarea} ${errors.Description ? styles.textareaError : ""}`}
        rows={6}
      />
      {errors.Description && <p className={styles.errorMessage}>{errors.Description.message}</p>}
    </div>
  );
});

DescriptionController.displayName = "DescriptionController";

export default DescriptionController;

