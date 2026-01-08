import { memo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Suspense } from "@/components";
import { useTea } from "@/hooks/useTea";
import { addTeaViewCountService } from "@/services";
import {
  BasicInfo,
  TeaHeader,
  TeaImages,
  PriceInfo,
  CategoryInfo,
  EditorInfo,
  MetaInfo,
  TagInfo,
  AttributesInfo,
} from "./components";

import styles from "./styles.module.css";

// 内部组件：实际渲染茶叶详情
const TeaDetailContent = memo(() => {
  const { teaId } = useParams<{ teaId: string }>();

  // Suspense 模式下，teaId 必须存在（由父组件保证）
  const { data: tea } = useTea(["tea", teaId], { id: teaId! });

  useEffect(() => {
    if (teaId) addTeaViewCountService(teaId);
  }, [teaId]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <TeaHeader teaId={teaId} />

        {/* Main Content */}
        <div className={styles.content}>
          {/* 茶叶图片 */}
          <TeaImages images={tea.images} name={tea.name} />

          {/* 基本信息 */}
          <BasicInfo
            name={tea.name}
            description={tea.description}
            show={tea.show}
            views={tea.views}
            status={tea.status}
          />

          {/* 价格信息 */}
          <PriceInfo price={tea.price} originalPrice={tea.originalPrice} stock={tea.stock} />

          {/* 分类信息 */}
          <CategoryInfo category={tea.category} subcategory={tea.subcategory} />

          {/* 产地与规格 */}
          <MetaInfo
            year={tea.year}
            origin={tea.origin}
            treeType={tea.treeType}
            form={tea.form}
            weight={tea.weight}
            batch={tea.batch}
            storage={tea.storage}
          />

          {/* 标签 */}
          <TagInfo tags={tea.tags ?? []} />

          {/* 扩展属性 */}
          <AttributesInfo attributes={tea.attributes} />

          {/* 编辑信息 */}
          <EditorInfo
            editorName={tea.editor ? `${tea.editor.id}` : `未知编辑者`}
            createdAt={tea.createdAt}
            updatedAt={tea.updatedAt}
            deletedAt={tea.deletedAt}
          />
        </div>
      </div>
    </div>
  );
});

TeaDetailContent.displayName = "TeaDetailContent";

// 主组件：使用 Suspense 包装
const TeaDetailPage = memo(() => {
  const { teaId } = useParams<{ teaId: string }>();
  const navigate = useNavigate();

  if (!teaId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2>茶叶 ID 无效</h2>
            <p>请从茶叶列表中选择要查看的茶叶。</p>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense loadingType="ecg" loadingText="加载茶叶详情中..." loadingSize="large">
      <TeaDetailContent />
    </Suspense>
  );
});

TeaDetailPage.displayName = "TeaDetailPage";

export default TeaDetailPage;

