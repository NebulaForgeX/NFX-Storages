import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { toNumberInputValue } from "@/utils/form";
import { showYearSelect } from "@/stores/modalStore";

import styles from "./styles.module.css";

const YearController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Year"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            生产年份 <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputGroup}>
            <input
              type="text"
              readOnly
              placeholder="2020"
              value={toNumberInputValue(field.value ?? 2020)}
              name={field.name}
              className={`${styles.input} ${error ? styles.inputError : ""}`}
            />
            <button
              type="button"
              className={styles.selectButton}
              onClick={() => {
                showYearSelect({
                  initialYear: (field.value as number) ?? 2020,
                  onSelect: (year) => field.onChange(year),
                });
              }}
            >
              选择
            </button>
          </div>
          <p className={styles.hint}>点击“选择”使用年份选择器，默认值为 2020。</p>
          {error && <p className={styles.error}>{error.message}</p>}
        </div>
      )}
    />
  );
});

YearController.displayName = "YearController";

export default YearController;


