import type { SubcategoryFormValues } from "../../controllers/subcategorySchema";

import { memo, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Image } from "@/assets/icons/lucide";

import { showCategorySelect } from "@/stores/modalStore";
import { buildImageUrl } from "@/utils/image";
import type { AuthCategory } from "@/apis/domain";

import CategoryStore, { useCategoryStore } from "../../stores/categoryStore";

import styles from "./styles.module.css";

const ParentCategoryController = memo(() => {
  const { control, setValue, getValues } = useFormContext<SubcategoryFormValues>();
  const category = useCategoryStore(state => state.category);
  const setCategory = CategoryStore.getState().setCategory;

  const handleOpenModal = useCallback(() => {
    const currentValue = getValues("ParentId");
    showCategorySelect({
      selectedId: currentValue,
      onSelect: (categoryId: string, category: AuthCategory) => {
        setValue("ParentId", categoryId, { shouldValidate: true });
        setCategory(category);
      },
    });
  }, [getValues, setValue, setCategory]);

  return (

      <Controller<SubcategoryFormValues>
        control={control}
        name="ParentId"
        render={({ fieldState: { error } }) => {
          return (
            <div className={styles.formControl}>
              <label className={styles.label}>
                父分类 <span className={styles.required}>*</span>
              </label>

              <div className={styles.container}>
                {/* 左侧：显示选中的分类信息 */}
                <div className={styles.infoContainer}>
                  {category ? (
                    <>
                      {/* 图片 */}
                      <div className={styles.imageContainer}>
                        {category.image ? (
                          <img
                            src={buildImageUrl(category.image, "category")}
                            alt={category.name}
                            className={styles.categoryImage}
                          />
                        ) : (
                          <div className={styles.imagePlaceholder}>
                            <Image size={20} />
                          </div>
                        )}
                      </div>

                      {/* 信息 */}
                      <div className={styles.categoryInfo}>
                        <div className={styles.categoryName}>{category.name}</div>
                        <div className={styles.categoryKey}>Key: {category.key}</div>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className={styles.categoryCount}>
                            {category.subcategories.length} 个子分类
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyInfo}>
                      <div className={styles.imagePlaceholder}>
                        <Image size={20} />
                      </div>
                      <span className={styles.emptyText}>未选择父分类</span>
                    </div>
                  )}
                </div>

                {/* 右侧：选择按钮 */}
                <button
                  type="button"
                  className={styles.selectButton}
                  onClick={handleOpenModal}
                >
                  {category ? "更换" : "选择"}
                </button>
              </div>

              {error && <p className={styles.errorMessage}>{error.message}</p>}
            </div>
          );
        }}
      />
  );
});

ParentCategoryController.displayName = "ParentCategoryController";

export default ParentCategoryController