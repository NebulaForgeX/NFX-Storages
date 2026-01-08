import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const DescriptionController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Description"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            茶叶描述 <span className={styles.required}>*</span>
          </label>
          <textarea
            {...field}
            value={field.value as string}
            placeholder="请输入茶叶描述"
            rows={6}
            className={`${styles.textarea} ${error ? styles.inputError : ""}`}
          />
          {error && <p className={styles.error}>{error.message}</p>}
        </div>
      )}
    />
  );
});

DescriptionController.displayName = "DescriptionController";

export default DescriptionController;

