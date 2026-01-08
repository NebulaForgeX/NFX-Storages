import { memo } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useInitTeaForm, useSubmitTea } from "@/elements/tea";

import { TeaForm } from "./components";
import styles from "./styles.module.css";

const TeaAddPage = memo(() => {
  const navigate = useNavigate();

  // Form setup
  const methods = useInitTeaForm();
  const { onSubmit, onSubmitError, isPending } = useSubmitTea();

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
          <h1 className={styles.title}>创建新茶叶</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.rightColumn}>
            <TeaForm onSubmit={onSubmit} onSubmitError={onSubmitError} isPending={isPending} />
          </div>
        </div>
      </div>
    </FormProvider>
  );
});

TeaAddPage.displayName = "TeaAddPage";

export default TeaAddPage;

