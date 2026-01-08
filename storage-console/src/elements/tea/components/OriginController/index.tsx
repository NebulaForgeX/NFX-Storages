import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const OriginController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Origin"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.fieldContainer}>
          <label className={styles.label}>
            产地 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            placeholder="例如：冰岛、小户赛、勐库"
            value={field.value as string ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
          />
          <p className={styles.hint}>用于展示茶叶的产地信息</p>
          {error && <p className={styles.error}>{error.message}</p>}
        </div>
      )}
    />
  );
});

OriginController.displayName = "OriginController";

export default OriginController;


