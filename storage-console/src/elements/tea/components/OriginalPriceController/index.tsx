import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const OriginalPriceController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="OriginalPrice"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>原价 (¥)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="选填，用于显示折扣"
            value={(field.value as number | null) ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              field.onChange(val === "" ? null : parseFloat(val) || 0);
            }}
            onBlur={field.onBlur}
            name={field.name}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
          />
          {error && <p className={styles.error}>{error.message}</p>}
          <p className={styles.hint}>💡 如果填写，将显示折扣效果</p>
        </div>
      )}
    />
  );
});

OriginalPriceController.displayName = "OriginalPriceController";

export default OriginalPriceController;

