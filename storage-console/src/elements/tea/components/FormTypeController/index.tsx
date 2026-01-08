import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { toTextInputValue } from "@/utils/form";

import styles from "./styles.module.css";

const FormTypeController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Form"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            茶叶形态 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            placeholder="例如：饼茶、砖茶、沱茶、散茶"
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

FormTypeController.displayName = "FormTypeController";

export default FormTypeController;


