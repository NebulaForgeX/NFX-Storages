import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { toTextInputValue } from "@/utils/form";

import styles from "./styles.module.css";

const StorageController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Storage"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            仓储方式 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            placeholder="例如：干仓、湿仓、石仓"
            value={toTextInputValue(field.value)}
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

StorageController.displayName = "StorageController";

export default StorageController;


