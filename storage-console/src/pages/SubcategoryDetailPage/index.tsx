import { memo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Suspense } from "@/components";
import { useSubcategory } from "@/hooks/useSubcategory";
import { BasicInfo, EditorInfo, ParentCategoryInfo, SubcategoryHeader, SubcategoryImage } from "./components";
import styles from "./styles.module.css";

// 内部组件：实际渲染子分类详情
const SubcategoryDetailContent = memo(() => {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();

  // Suspense 模式下，subcategoryId 必须存在（由父组件保证）
  const { data: subcategory } = useSubcategory(
    ["subcategory", subcategoryId],
    { id: subcategoryId! },
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <SubcategoryHeader subcategoryId={subcategoryId} />

        {/* Main Content */}
        <div className={styles.content}>
          {/* 子分类图片 */}
          <SubcategoryImage image={subcategory.image} name={subcategory.name} />

          {/* 基本信息 */}
          <BasicInfo 
            name={subcategory.name}
            keyValue={subcategory.key}
            show={subcategory.show}
            description={subcategory.description}
          />

          {/* 所属分类 */}
          <ParentCategoryInfo parentCategory={subcategory.parent} />

          {/* 编辑信息 */}
          <EditorInfo 
            editorName={subcategory.editor ? `${subcategory.editor.firstName} ${subcategory.editor.lastName}` : undefined}
            createdAt={subcategory.createdAt}
            updatedAt={subcategory.updatedAt}
            deletedAt={subcategory.deletedAt}
          />
        </div>
      </div>
    </div>
  );
});

SubcategoryDetailContent.displayName = "SubcategoryDetailContent";

// 主组件：使用 Suspense 包装
const SubcategoryDetailPage = memo(() => {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();
  const navigate = useNavigate();

  if (!subcategoryId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2>子分类 ID 无效</h2>
            <p>请从子分类列表中选择要查看的子分类。</p>
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
      loadingText="加载子分类详情中..."
      loadingSize="large"
    >
      <SubcategoryDetailContent />
    </Suspense>
  );
});

SubcategoryDetailPage.displayName = "SubcategoryDetailPage";

export default SubcategoryDetailPage;

