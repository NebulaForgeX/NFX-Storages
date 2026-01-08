import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const PriceController = memo(() => {
  const { control, formState: { errors }, watch } = useFormContext<TeaFormValues>();

  const originalPrice = watch("OriginalPrice");
  const price = watch("Price");

  // 计算折扣比例
  const discountPercentage = 
    originalPrice && originalPrice > 0 && price > 0 && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return (
    <div className={styles.formControl}>
      <div className={styles.row}>
        {/* 当前价格 */}
        <div className={styles.field}>
          <label className={styles.label}>
            当前价格 (¥) <span className={styles.required}>*</span>
          </label>
          <Controller
            control={control}
            name="Price"
            render={({ field }) => (
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>¥</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`${styles.input} ${errors.Price ? styles.inputError : ""}`}
                  value={field.value === undefined ? "" : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      field.onChange(undefined);
                    } else {
                      const num = parseFloat(val);
                      field.onChange(isNaN(num) ? undefined : num);
                    }
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </div>
            )}
          />
          {errors.Price && <p className={styles.errorMessage}>{errors.Price.message}</p>}
        </div>

        {/* 原价 */}
        <div className={styles.field}>
          <label className={styles.label}>原价 (¥)</label>
          <Controller
            control={control}
            name="OriginalPrice"
            render={({ field }) => (
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>¥</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="选填"
                  className={`${styles.input} ${errors.OriginalPrice ? styles.inputError : ""}`}
                  value={field.value === null || field.value === undefined ? "" : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      field.onChange(null);
                    } else {
                      const num = parseFloat(val);
                      field.onChange(isNaN(num) ? null : num);
                    }
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </div>
            )}
          />
          {errors.OriginalPrice && <p className={styles.errorMessage}>{errors.OriginalPrice.message}</p>}
        </div>
      </div>

      {/* 折扣信息 */}
      {discountPercentage > 0 && (
        <div className={styles.discountInfo}>
          <span className={styles.discountLabel}>折扣</span>
          <span className={styles.discountValue}>{discountPercentage}% OFF</span>
        </div>
      )}
    </div>
  );
});

PriceController.displayName = "PriceController";

export default PriceController;

