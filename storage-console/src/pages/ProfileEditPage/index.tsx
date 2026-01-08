import { memo } from "react";
import { FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Button, TruckLoading } from "@/components";
import { useSelfProfile } from "@/hooks/useProfile";
import { ROUTES } from "@/types/navigation";

import { FirstNameController, LastNameController } from "./components";
import { useEditProfileForm, useSubmitProfile } from "./hooks";
import styles from "./styles.module.css";

const ProfileEditPage = memo(() => {
  const navigate = useNavigate();
  const { isLoading } = useSelfProfile();
  const methods = useEditProfileForm();
  const { onSubmit, isPending } = useSubmitProfile();

  const {
    handleSubmit,
    formState: { isDirty },
  } = methods;

  const handleCancel = () => {
    navigate(ROUTES.PROFILE);
  };

  if (isLoading) {
    return (
      <div className={styles.editPage}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <TruckLoading size="medium" />
            <p className={styles.loadingText}>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>编辑资料</h1>
          <p className={styles.subtitle}>更新您的个人信息</p>
        </div>

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <FirstNameController />
            <LastNameController />

            {/* Actions */}
            <div className={styles.actions}>
              <Button type="button" onClick={handleCancel} disabled={isPending}>
                取消
              </Button>
              <Button type="submit" disabled={isPending || !isDirty}>
                {isPending ? "保存中..." : "保存更改"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
});

ProfileEditPage.displayName = "ProfileEditPage";

export default ProfileEditPage;
