import { memo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Suspense } from "@/components";
import { useCategory } from "@/hooks/useCategory";

import { BasicInfo, CategoryHeader, CategoryImage, EditorInfo, SubcategoryList } from "./components";
import styles from "./styles.module.css";

// 内部组件：实际渲染分类详情
const CategoryDetailContent = memo(() => {
  const { categoryId } = useParams<{ categoryId: string }>();

  // Suspense 模式下，categoryId 必须存在（由父组件保证）
  const { data: category } = useCategory(
    ["category", categoryId],
    { id: categoryId! },
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <CategoryHeader categoryId={categoryId} />

        {/* Main Content */}
        <div className={styles.content}>
          {/* 分类图片 */}
          <CategoryImage image={category.image} name={category.name} />

          {/* 基本信息 */}
          <BasicInfo 
            name={category.name}
            keyValue={category.key}
            show={category.show}
            subcategoryCount={category.subcategories?.length || 0}
            description={category.description}
          />

          {/* 编辑信息 */}
          <EditorInfo 
            editorName={category.editor ? `${category.editor.firstName} ${category.editor.lastName}` : undefined}
            createdAt={category.createdAt}
            updatedAt={category.updatedAt}
            deletedAt={category.deletedAt}
          />

          {/* 子分类列表 */}
          <SubcategoryList categoryId={categoryId!} />
        </div>
      </div>
    </div>
  );
});

CategoryDetailContent.displayName = "CategoryDetailContent";

// 主组件：使用 Suspense 包装
const CategoryDetailPage = memo(() => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  if (!categoryId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2>分类 ID 无效</h2>
            <p>请从分类列表中选择要查看的分类。</p>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      loadingType="ecg"
      loadingText="加载分类详情中..."
      loadingSize="large"
    >
      <CategoryDetailContent />
    </Suspense>
  );
});

CategoryDetailPage.displayName = "CategoryDetailPage";

export default CategoryDetailPage;

