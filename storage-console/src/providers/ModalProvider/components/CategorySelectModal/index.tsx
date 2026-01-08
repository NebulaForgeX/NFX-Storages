import { memo, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { X, Search, Loader, Image } from "@/assets/icons/lucide";

import { useCategoryList } from "@/hooks/useCategory";
import { VirtualList, Suspense } from "@/components";
import ModalStore, { useModalStore } from "@/stores/modalStore";
import { buildImageUrl } from "@/utils/image";
import type { AuthCategory } from "@/types";

import styles from "./styles.module.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = memo(({ value, onChange, placeholder = "搜索..." }: SearchBarProps) => {
  return (
    <div className={styles.searchContainer}>
      <Search className={styles.searchIcon} size={18} />
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
      {value && (
        <button
          className={styles.clearButton}
          onClick={() => onChange("")}
          aria-label="清除搜索"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});
SearchBar.displayName = "SearchBar";

interface CategoryItemProps {
  category: AuthCategory;
  isSelected: boolean;
  onSelect: (categoryId: string, category: AuthCategory) => void;
}

const CategoryItem = memo(({ category, isSelected, onSelect }: CategoryItemProps) => {
  return (
    <button
      className={`${styles.item} ${isSelected ? styles.itemSelected : ""}`}
      onClick={() => onSelect(category.id, category)}
    >
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
            <Image size={20} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.itemContent}>
        <div className={styles.itemHeader}>
          <span className={styles.itemName}>{category.name}</span>
          {!category.show && <span className={styles.badge}>隐藏</span>}
        </div>
        <div className={styles.itemMeta}>
          <span className={styles.itemKey}>Key: {category.key}</span>
          {category.subcategories && category.subcategories.length > 0 && (
            <span className={styles.itemCount}>
              {category.subcategories.length} 个子分类
            </span>
          )}
        </div>
        {category.description && (
          <p className={styles.itemDescription}>
            {category.description.length > 100
              ? `${category.description.slice(0, 100)}...`
              : category.description}
          </p>
        )}
      </div>

      {/* Checkmark */}
      {isSelected && <div className={styles.checkmark}>✓</div>}
    </button>
  );
});
CategoryItem.displayName = "CategoryItem";

interface CategorySelectListProps {
  searchKeyword: string;
  selectedId?: string;
  onSelect: (categoryId: string, category: AuthCategory) => void;
}

const CategorySelectList = memo(({ searchKeyword, selectedId, onSelect }: CategorySelectListProps) => {
  const filter = useMemo(() => {
    return searchKeyword ? { search: searchKeyword } : undefined;
  }, [searchKeyword]);

  // 获取所有分类
  const {
    data: categories = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    error,
  } = useCategoryList(["categories", "select-modal", searchKeyword], filter);

  // Empty state
  const emptyStateContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className={styles.loading}>
          <Loader className={styles.spinner} size={32} />
          <p className={styles.loadingText}>加载分类中...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.error}>
          <p className={styles.errorText}>加载失败，请重试</p>
        </div>
      );
    }
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>
          {searchKeyword ? "未找到匹配的分类" : "暂无分类"}
        </p>
      </div>
    );
  }, [isLoading, error, searchKeyword]);

  const loadingIndicator = useMemo(
    () => (
      <div className={styles.loadingMore}>
        <div className={styles.spinner}></div>
        <span>加载更多分类...</span>
      </div>
    ),
    []
  );

  const endOfListIndicator = useMemo(
    () => (
      <div className={styles.endState}>
        <div className={styles.endLine}></div>
        <span className={styles.endText}>已加载全部分类</span>
        <div className={styles.endLine}></div>
      </div>
    ),
    []
  );

  return (
      <div className={styles.listContainer}>
        <VirtualList
          data={categories}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          renderItem={(category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isSelected={category.id === selectedId}
              onSelect={onSelect}
            />
          )}
          getItemKey={(category) => category.id}
          estimateSize={120}
          height="calc(60vh - 100px)"
          emptyState={emptyStateContent}
          loadingIndicator={loadingIndicator}
          endOfListIndicator={endOfListIndicator}
        />
              <div className={styles.footer}>
        <p className={styles.footerText}>共 {categories.length} 个分类</p>
      </div>
      </div>
  );
});
CategorySelectList.displayName = "CategorySelectList";

const CategorySelectModal = memo(() => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = useModalStore((state) => state.categorySelectModal.isOpen);
  const selectedId = useModalStore((state) => state.categorySelectModal.selectedId);
  const onSelect = ModalStore.getState().categorySelectModal.onSelect;
  const hideModal = ModalStore.getState().hideModal;
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    hideModal("categorySelect");
    setSearchKeyword("");
  }, [hideModal]);

  const handleSelect = useCallback(
    (categoryId: string, category: AuthCategory) => {
      if (onSelect) onSelect(categoryId, category);
      handleClose();
    },
    [onSelect, handleClose]
  );

  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!isInDialog) handleClose();
    },
    [handleClose]
  );

    return (
      <dialog ref={dialogRef} className={styles.modal} onClick={handleDialogClick} onClose={handleClose}>
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>选择父分类</h2>
            <button className={styles.closeButton} onClick={handleClose}>
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <SearchBar
            value={searchKeyword}
            onChange={setSearchKeyword}
            placeholder="搜索分类名称、Key 或描述..."
          />

          {/* Categories List */}
          {isOpen && <Suspense
            loadingType="ecg"
            loadingText="加载分类中..."
            loadingSize="small"
            loadingContainerClassName={styles.emptyState}
          >
            <CategorySelectList
            searchKeyword={searchKeyword}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </Suspense>}
        </div>
      </dialog>
    );
  }
);

CategorySelectModal.displayName = "CategorySelectModal";
export default CategorySelectModal;

