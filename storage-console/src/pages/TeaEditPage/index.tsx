import { memo } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { FormProvider } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { ECGLoading, Suspense } from "@/components";
import { useEditTea, useInitTeaForm } from "@/elements/tea";
import { useTea } from "@/hooks/useTea";

import { TeaForm } from "./components";
import styles from "./styles.module.css";

const TeaEditPageContent = memo(() => {
  const navigate = useNavigate();
  const { teaId } = useParams<{ teaId: string }>();

  if (!teaId) {
    navigate(-1);
    return null;
  }

  const { data: tea } = useTea(
    ["tea", teaId],
    { id: teaId },
  );
  const methods = useInitTeaForm(tea);
  const { onSubmit, onSubmitError, isPending } = useEditTea(teaId);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <FormProvider {...methods}>
      <div className={styles.page}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={styles.title}>编辑茶叶 - {tea.name}</h1>
            <p className={styles.subtitle}>更新「{tea.name}」的信息</p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.rightColumn}>
            <TeaForm onSubmit={onSubmit} onSubmitError={onSubmitError} isPending={isPending} isEditMode />
          </div>
        </div>
      </div>
    </FormProvider>
  );
});

TeaEditPageContent.displayName = "TeaEditPageContent";

const TeaEditPage = memo(() => (
  <Suspense
    fallback={
      <div className={styles.loadingContainer}>
        <ECGLoading size="medium" />
        <p className={styles.loadingText}>加载茶叶信息中...</p>
      </div>
    }
  >
    <TeaEditPageContent />
  </Suspense>
));

TeaEditPage.displayName = "TeaEditPage";

export default TeaEditPage;

