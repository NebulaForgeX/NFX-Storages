import type { AuthCategory } from "@/apis/domain";

import { memo, useCallback } from "react";
import { Edit, Eye, Image, Plus, Tag, Trash2 } from "@/assets/icons/lucide";

import { buildImageUrl } from "@/utils/image";
import { useActionCategoryItem } from "../../hooks";

import styles from "./styles.module.css";

interface CategoryListItemProps {
  category: AuthCategory;
  onClick?: (category: AuthCategory) => void;
}

const CategoryListItem = memo(({ 
  category, 
  onClick
}: CategoryListItemProps) => {
  const { handleEdit, handleView, handleAddSubcategory, handleDelete } = useActionCategoryItem();

  const handleClick = useCallback(() => {
    onClick?.(category);
  }, [onClick, category]);

  const subcategoryCount = category.subcategories?.length || 0;

  return (
    <article className={styles.categoryListItem} onClick={handleClick}>
      {/* Image */}
      <div className={styles.imageContainer}>
        {category.image ? (
          <img
            src={buildImageUrl(category.image, "category")}
            alt={category.name}
            className={styles.categoryImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <Image size={24} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.contentContainer}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>{category.name}</h3>
            {category.key && (
              <span className={styles.key}>
                <Tag size={14} />
                {category.key}
              </span>
            )}
          </div>
          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={handleAddSubcategory(category)} title="添加子分类">
              <Plus size={18} />
            </button>
            <button className={styles.actionButton} onClick={handleEdit(category)} title="编辑">
              <Edit size={18} />
            </button>
            <button className={styles.actionButton} onClick={handleView(category)} title="查看">
              <Eye size={18} />
            </button>
            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete(category)} title="删除">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {category.description && (
          <p className={styles.description}>{category.description}</p>
        )}

        <div className={styles.metaRow}>
          <span className={`${styles.badge} ${category.show ? styles.show : styles.hide}`}>
            {category.show ? "显示" : "隐藏"}
          </span>
          {subcategoryCount > 0 && (
            <span className={styles.subcategoryCount}>
              {subcategoryCount} 个子分类
            </span>
          )}
          {category.editor && (
            <span className={styles.editor}>
              编辑者: {category.editor.firstName} {category.editor.lastName}
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

CategoryListItem.displayName = "CategoryListItem";

export default CategoryListItem;

