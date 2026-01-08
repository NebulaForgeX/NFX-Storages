import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const ShowController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Show"
      render={({ field }) => {
        const checked = Boolean(field.value);
        return (
          <div className={styles.container}>
            <label className={styles.switchLabel}>
              <span className={styles.labelText}>显示茶叶</span>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => field.onChange(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.switch}>
                <span className={styles.switchThumb} />
              </span>
            </label>
            <p className={styles.hint}>{checked ? "✅ 茶叶将在前台显示" : "❌ 茶叶不会在前台显示"}</p>
          </div>
        );
      }}
    />
  );
});

ShowController.displayName = "ShowController";

export default ShowController;

