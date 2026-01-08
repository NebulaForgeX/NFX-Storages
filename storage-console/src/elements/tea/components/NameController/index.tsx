import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const NameController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Name"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            茶叶名称 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            placeholder="请输入茶叶名称"
            value={field.value as string}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
          />
          {error && <p className={styles.error}>{error.message}</p>}
        </div>
      )}
    />
  );
});

NameController.displayName = "NameController";

export default NameController;

