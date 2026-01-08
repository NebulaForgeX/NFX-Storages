import type { SubcategoryFormValues } from "../../controllers/subcategorySchema";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const ShowController = memo(() => {
  const { control } = useFormContext<SubcategoryFormValues>();

  return (
    <Controller<SubcategoryFormValues>
      control={control}
      name="Show"
      render={({ field }) => {
        const checked = Boolean(field.value);
        return (
          <div className={styles.container}>
            <label className={styles.switchLabel}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => field.onChange(e.target.checked)}
                className={styles.switch}
              />
              <span className={styles.switchText}>显示子分类</span>
            </label>
            <p className={styles.hint}>关闭后，子分类将不在前台显示</p>
          </div>
        );
      }}
    />
  );
});

ShowController.displayName = "ShowController";

export default ShowController;

