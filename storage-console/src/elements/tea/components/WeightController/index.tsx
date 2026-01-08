import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { toNumberInputValue } from "@/utils/form";

import styles from "./styles.module.css";

const WeightController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Weight"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            净重 (g) <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="请输入重量（克）"
              value={toNumberInputValue(field.value)}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "") {
                  field.onChange(undefined);
                } else {
                  const parsed = Number.parseFloat(value);
                  field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                }
              }}
              onBlur={field.onBlur}
              name={field.name}
              className={`${styles.input} ${error ? styles.inputError : ""}`}
            />
            <span className={styles.unit}>g</span>
          </div>
          {error && <p className={styles.error}>{error.message}</p>}
        </div>
      )}
    />
  );
});

WeightController.displayName = "WeightController";

export default WeightController;


