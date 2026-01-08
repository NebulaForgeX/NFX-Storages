import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ChevronUp, ChevronDown } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

const StockController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Stock"
      render={({ field, fieldState: { error } }) => {
        const numericValue = typeof field.value === "number" ? field.value : Number(field.value ?? 0);
        const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
        const inputValue = field.value === undefined || field.value === null ? "" : String(field.value);

        const handleIncrement = useCallback(() => {
          const next = safeValue + 1;
          field.onChange(next);
        }, [field, safeValue]);

        const handleDecrement = useCallback(() => {
          const next = safeValue - 1;
          field.onChange(next < 0 ? 0 : next);
        }, [field, safeValue]);

        return (
          <div className={styles.fieldContainer}>
            <label className={styles.label}>
              库存数量 <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputGroup}>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="请输入库存数量"
                value={inputValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    field.onChange(undefined);
                  } else {
                    const num = Number(val);
                    field.onChange(Number.isFinite(num) ? num : undefined);
                  }
                }}
                onBlur={field.onBlur}
                name={field.name}
                className={`${styles.input} ${error ? styles.inputError : ""}`}
              />
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.incrementBtn}
                  onClick={handleIncrement}
                  aria-label="增加"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  className={styles.decrementBtn}
                  onClick={handleDecrement}
                  aria-label="减少"
                  disabled={safeValue <= 0}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
            {error && <p className={styles.error}>{error.message}</p>}
          </div>
        );
      }}
    />
  );
});

StockController.displayName = "StockController";

export default StockController;

