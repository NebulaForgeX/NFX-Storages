import type { SubcategoryFormValues } from "../../controllers/subcategorySchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const DescriptionController = memo(() => {
  const {
    register,
    formState: { errors },
  } = useFormContext<SubcategoryFormValues>();

  return (
    <div className={styles.formControl}>
      <label className={styles.label}>子分类描述</label>
      <textarea
        {...register("Description")}
        placeholder="请输入子分类描述（选填）"
        className={`${styles.textarea} ${errors.Description ? styles.textareaError : ""}`}
        rows={4}
        maxLength={500}
      />
      {errors.Description && <p className={styles.errorMessage}>{errors.Description.message}</p>}
    </div>
  );
});

DescriptionController.displayName = "DescriptionController";

export default DescriptionController;

