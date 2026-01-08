import type { AuthTea, CategorySimple, SubcategorySimple } from "@/apis/domain";

import { memo, useCallback, useMemo } from "react";
import {
  Calendar,
  Edit,
  Eye,
  Box,
  Globe,
  Image,
  Leaf,
  Layers,
  Package,
  Tag as TagIcon,
  Trash2,
} from "@/assets/icons/lucide";

import { TeaStatusEnum, TeaStatusLabelMap } from "@/apis/types/enums";
import { buildImageUrl } from "@/utils/image";
import { useActionTeaItem } from "../../hooks";

import styles from "./styles.module.css";

interface TeaListItemProps {
  tea: AuthTea;
  onClick?: (tea: AuthTea) => void;
}

const TeaListItem = memo(({ tea, onClick }: TeaListItemProps) => {
  const { handleEdit, handleView, handleDelete } = useActionTeaItem();

  const handleClick = useCallback(() => {
    onClick?.(tea);
  }, [onClick, tea]);

  const primaryImage = tea.images?.[0]?.imageFile;

  const statusLabel =
    TeaStatusLabelMap[(tea.status as TeaStatusEnum) ?? TeaStatusEnum.ON_SHELF] ?? tea.status;

  const attributesEntries = useMemo(
    () =>
      tea.attributes
        ? Object.entries(tea.attributes).map(([key, value]) => ({
            key,
            value: value === null || value === undefined ? "-" : String(value),
          }))
        : [],
    [tea.attributes],
  );

  return (
    <article className={styles.teaListItem} onClick={handleClick}>
      <div className={styles.imageContainer}>
        {primaryImage ? (
          <img
            src={buildImageUrl(primaryImage, "tea")}
            alt={tea.name}
            className={styles.teaImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <Image size={24} />
          </div>
        )}
        {tea.images && tea.images.length > 1 && (
          <div className={styles.imageCount}>
            <Image size={12} />
            <span>{tea.images.length}</span>
          </div>
        )}
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>{tea.name}</h3>
            <span className={`${styles.statusBadge} ${styles[`status-${tea.status}`] ?? ""}`}>
              {statusLabel}
            </span>
            <span className={`${styles.visibilityBadge} ${tea.show ? styles.show : styles.hide}`}>
              {tea.show ? "显示" : "隐藏"}
            </span>
          </div>
          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={handleEdit(tea)} title="编辑">
              <Edit size={18} />
            </button>
            <button className={styles.actionButton} onClick={handleView(tea)} title="查看">
              <Eye size={18} />
            </button>
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDelete(tea)}
              title="删除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>



        <PublicInfo description={tea.description} price={tea.price} originalPrice={tea.originalPrice} stock={tea.stock} views={tea.views} />

        <MetaItem year={tea.year} origin={tea.origin} treeType={tea.treeType} form={tea.form} weight={tea.weight} storage={tea.storage} batch={tea.batch} />

        <CategoryItem category={tea.category} subcategory={tea.subcategory} />

        <TagList tags={tea.tags ?? []} />
        <AttributesList entries={attributesEntries} />
      </div>
    </article>
  );
});

TeaListItem.displayName = "TeaListItem";

export default TeaListItem;

interface PublicInfoProps {
  description?: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  views: number;
}

const PublicInfo = memo(({ description, price, originalPrice, stock, views }: PublicInfoProps) => {

  const priceText = useMemo(() => `¥${price.toFixed(2)}`, [price]);
  const originalPriceValue =
    originalPrice === null || originalPrice === undefined ? null : originalPrice;
  const originalPriceText = useMemo(
    () => (originalPriceValue !== null ? `¥${originalPriceValue.toFixed(2)}` : null),
    [originalPriceValue],
  );
  return (
    <>
    {description && <p className={styles.description}>{description}</p>}
    <div className={styles.priceRow}>
    <div className={styles.priceGroup}>
      <span className={styles.currentPrice}>{priceText}</span>
      {originalPriceText && originalPriceValue !== null && originalPriceValue > price && (
        <span className={styles.originalPrice}>{originalPriceText}</span>
      )}
    </div>
    <div className={styles.stock}>
      <Package size={14} />
      <span>库存 {stock}</span>
    </div>
    <span className={styles.views}>{views} 次浏览</span>
  </div>
  </>
  );
});







interface CategoryItemProps {
  category: CategorySimple | undefined;
  subcategory: SubcategorySimple | undefined;
}

const CategoryItem = memo(({ category, subcategory }: CategoryItemProps) => {
  return (
    <div className={styles.categoryRow}>
      {category && <span className={styles.categoryTag}>{category.name}</span>}
      {subcategory && (
        <span className={styles.subcategoryTag}>{subcategory.name}</span>
      )}
    </div>
  );
});


interface MetaItemProps {
  year: number;
  origin: string;
  treeType: string;
  form: string;
  weight: number;
  storage: string;
  batch?: string;
}

const MetaItem = memo(({ year, origin, treeType, form, weight, storage, batch }: MetaItemProps) => {
  return (
    <div className={styles.metaGrid}>
    <div className={styles.metaItem}>
      <Calendar size={14} />
      <span>{year} 年</span>
    </div>
    <div className={styles.metaItem}>
      <Globe size={14} />
      <span>{origin || "未填写产地"}</span>
    </div>
    <div className={styles.metaItem}>
      <Leaf size={14} />
      <span>{treeType || "未指定树种"}</span>
    </div>
    <div className={styles.metaItem}>
      <Layers size={14} />
      <span>{form || "未指定形态"}</span>
    </div>
    <div className={styles.metaItem}>
      <Package size={14} />
      <span>{weight} g</span>
    </div>
    <div className={styles.metaItem}>
      <Box size={14} />
      <span>{storage || "未填写仓储"}</span>
    </div>
    {batch && (
      <div className={styles.metaItem}>
        <TagIcon size={14} />
        <span>批次 {batch}</span>
      </div>
    )}
  </div>
  );
});

interface TagListProps {
  tags: string[];
}

const TagList = memo(({ tags }: TagListProps) => {
  if (!tags.length) return null;

  return (
    <div className={styles.tagRow}>
      <TagIcon size={14} className={styles.tagIcon} />
      <div className={styles.tagList}>
        {tags.map(tag => (
          <span className={styles.tagText} key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
});

interface AttributesListProps {
  entries: { key: string; value: string }[];
}

const AttributesList = memo(({ entries }: AttributesListProps) => {
  if (!entries.length) return null;

  return (
    <div className={styles.attributesRow}>
      <div className={styles.attributeIcon}>
        <Box size={14} />
      </div>
      <div className={styles.attributeList}>
        {entries.map(({ key, value }) => (
          <span className={styles.attributeChip} key={key}>
            <span className={styles.attributeKey}>{key}</span>
            <span className={styles.attributeValue}>{value}</span>
          </span>
        ))}
      </div>
    </div>
  );
});

