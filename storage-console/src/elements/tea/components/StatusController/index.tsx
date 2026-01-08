import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { TeaStatusEnum, TeaStatusLabelMap } from "@/apis/types/enums";
import Dropdown from "@/components/Dropdown";

import styles from "./styles.module.css";

const STATUS_OPTIONS: Array<{ value: TeaStatusEnum; label: string }> = Object.values(TeaStatusEnum).map(
  (status) => ({
    value: status,
    label: TeaStatusLabelMap[status],
  }),
);

const StatusController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Status"
      render={({ field, fieldState: { error } }) => (
        <div className={styles.container}>
          <label className={styles.label}>
            上架状态 <span className={styles.required}>*</span>
          </label>
          <Dropdown
            options={STATUS_OPTIONS}
            value={(field.value as string) ?? ""}
            onChange={(value) => {
              field.onChange(value as TeaStatusEnum);
            }}
            disabled={false}
            error={!!error}
            className={styles.dropdown}
          />
          <p className={styles.hint}>状态用于控制前台展示，默认“上架”</p>
          {error && <p className={styles.error}>{error.message}</p>}
        </div>
      )}
    />
  );
});

StatusController.displayName = "StatusController";

export default StatusController;


