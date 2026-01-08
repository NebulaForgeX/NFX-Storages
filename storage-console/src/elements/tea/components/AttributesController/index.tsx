import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { Plus, Trash2 } from "@/assets/icons/lucide";
import { toTextInputValue } from "@/utils/form";

import styles from "./styles.module.css";

const AttributesController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "Attributes",
  });

  const handleAddAttribute = () => {
    append({ key: "", value: "" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>扩展属性</p>
          <p className={styles.subtitle}>用于补充如香型、仓储年限等任意键值对信息，默认会以对象形式提交给后端</p>
        </div>
        <button type="button" className={styles.addButton} onClick={handleAddAttribute}>
          <Plus size={16} />
          新增属性
        </button>
      </div>

      <div className={styles.list}>
        {fields.length === 0 && (
          <p className={styles.emptyHint}>当前暂无属性，点击右上角按钮新增。提交时默认会传递空对象。</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className={styles.row}>
            <div className={styles.column}>
              <Controller<TeaFormValues>
                control={control}
                name={`Attributes.${index}.key`}
                render={({ field, fieldState: { error } }) => {
                  const inputValue = toTextInputValue(field.value);

                  return (
                    <>
                      <label className={styles.label}>属性名</label>
                      <input
                        type="text"
                        placeholder="例如：香气"
                        value={inputValue}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        className={`${styles.input} ${error ? styles.inputError : ""}`}
                      />
                      {error && <p className={styles.error}>{error.message}</p>}
                    </>
                  );
                }}
              />
            </div>

            <div className={styles.column}>
              <Controller<TeaFormValues>
                control={control}
                name={`Attributes.${index}.value`}
                render={({ field, fieldState: { error } }) => {
                  const inputValue = toTextInputValue(field.value);

                  return (
                    <>
                      <label className={styles.label}>属性值</label>
                      <input
                        type="text"
                        placeholder="例如：花香、蜜香"
                        value={inputValue}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        className={`${styles.input} ${error ? styles.inputError : ""}`}
                      />
                      {error && <p className={styles.error}>{error.message}</p>}
                    </>
                  );
                }}
              />
            </div>

            <button
              type="button"
              className={styles.removeButton}
              onClick={() => remove(index)}
              aria-label="删除属性"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

AttributesController.displayName = "AttributesController";

export default AttributesController;


