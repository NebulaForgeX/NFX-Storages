import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { toTextInputValue } from "@/utils/form";

import styles from "./styles.module.css";

const TreeTypeController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="TreeType"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            树种类型 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            placeholder="例如：古树、乔木、台地"
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

TreeTypeController.displayName = "TreeTypeController";

export default TreeTypeController;


