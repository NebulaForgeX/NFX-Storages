import type { AuthSubcategory } from "@/apis/domain";

import { memo, useCallback } from "react";
import { Edit, Eye, Image, Tag, Trash2 } from "@/assets/icons/lucide";

import { buildImageUrl } from "@/utils/image";
import { useActionSubcategoryItem } from "../../hooks";

import styles from "./styles.module.css";

interface SubcategoryListItemProps {
  subcategory: AuthSubcategory;
  onClick?: (subcategory: AuthSubcategory) => void;
}

const SubcategoryListItem = memo(({ 
  subcategory, 
  onClick
}: SubcategoryListItemProps) => {
  const { handleEdit, handleView, handleDelete } = useActionSubcategoryItem();

  const handleClick = useCallback(() => {
    onClick?.(subcategory);
  }, [onClick, subcategory]);

  return (
    <article className={styles.subcategoryListItem} onClick={handleClick}>
      {/* Image */}
      <div className={styles.imageContainer}>
        {subcategory.image ? (
          <img
            src={buildImageUrl(subcategory.image, "category")}
            alt={subcategory.name}
            className={styles.subcategoryImage}
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
            <h3 className={styles.title}>{subcategory.name}</h3>
            {subcategory.key && (
              <span className={styles.key}>
                <Tag size={14} />
                {subcategory.key}
              </span>
            )}
          </div>
          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={handleEdit(subcategory)} title="编辑">
              <Edit size={18} />
            </button>
            <button className={styles.actionButton} onClick={handleView(subcategory)} title="查看">
              <Eye size={18} />
            </button>
            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete(subcategory)} title="删除">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {subcategory.description && (
          <p className={styles.description}>{subcategory.description}</p>
        )}

        <div className={styles.metaRow}>
          <span className={`${styles.badge} ${subcategory.show ? styles.show : styles.hide}`}>
            {subcategory.show ? "显示" : "隐藏"}
          </span>
          {subcategory.parent && (
            <span className={styles.parent}>
              父分类: {subcategory.parent.name}
            </span>
          )}
          {subcategory.editor && (
            <span className={styles.editor}>
              编辑者: {subcategory.editor.firstName} {subcategory.editor.lastName}
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

SubcategoryListItem.displayName = "SubcategoryListItem";

export default SubcategoryListItem;

