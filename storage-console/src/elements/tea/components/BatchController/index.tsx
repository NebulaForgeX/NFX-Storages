import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { toTextInputValue } from "@/utils/form";

import styles from "./styles.module.css";

const BatchController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Batch"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>批次编号</label>
          {(() => {
            const inputValue = toTextInputValue(field.value);

            return (
              <input
                type="text"
                placeholder="请输入批次信息（选填）"
                value={inputValue}
                onChange={event => {
                  field.onChange(event.target.value);
                }}
                onBlur={field.onBlur}
                name={field.name}
                className={`${styles.input} ${error ? styles.inputError : ""}`}
              />
            );
          })()}
          {error && <p className={styles.error}>{error.message}</p>}
        </div>
      )}
    />
  );
});

BatchController.displayName = "BatchController";

export default BatchController;


