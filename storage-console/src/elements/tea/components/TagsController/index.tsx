import type { TeaFormValues } from "../../controllers/teaSchema";

import { memo } from "react";
import { Control, Controller, useFieldArray, useFormContext } from "react-hook-form";

import { Plus, Tag as TagIcon, Trash2 } from "@/assets/icons/lucide";
import { toTextInputValue } from "@/utils/form";

import styles from "./styles.module.css";

const TagsController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();
  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control: control as unknown as Control<{ Tags: string[] }>,
    name: "Tags" as never,
  });

  const appendTag = append as unknown as (value: string) => void;

  const handleAddTag = () => {
    appendTag("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <TagIcon size={18} className={styles.icon} />
          <div>
            <p className={styles.title}>标签</p>
            <p className={styles.subtitle}>用于前台检索和推荐展示</p>
          </div>
        </div>
        <button type="button" className={styles.addButton} onClick={handleAddTag}>
          <Plus size={16} />
          新增标签
        </button>
      </div>

      <div className={styles.list}>
        {fields.length === 0 && (
          <p className={styles.emptyHint}>暂无标签，点击右上角按钮新增</p>
        )}

        {fields.map((fieldItem, index) => (
          <Controller<TeaFormValues>
            key={fieldItem.id}
            control={control}
            name={`Tags.${index}` as const}
            render={({ field, fieldState: { error } }) => {
              const inputValue = toTextInputValue(field.value);

              return (
                <div className={styles.tagRow}>
                  <input
                    type="text"
                    placeholder="请输入标签内容"
                    value={inputValue}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    className={`${styles.input} ${error ? styles.inputError : ""}`}
                  />
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => remove(index)}
                    aria-label="删除标签"
                  >
                    <Trash2 size={16} />
                  </button>
                  {error && <p className={styles.error}>{error.message}</p>}
                </div>
              );
            }}
          />
        ))}
      </div>
    </div>
  );
});

TagsController.displayName = "TagsController";

export default TagsController;


