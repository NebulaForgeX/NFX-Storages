import { memo } from "react";
import { useNavigate } from "react-router-dom";

import { TruckLoading } from "@/components";
import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

const NotFoundPage = memo(() => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <main className={styles.page}>
      {/* 404文字动画 */}
      <div className={styles.errorContainer}>
        <div className={styles.errorCode}>
          <span className={styles.digit}>4</span>
          <span className={styles.digit}>0</span>
          <span className={styles.digit}>4</span>
        </div>

        <div className={styles.errorMessage}>
          <h1 className={styles.title}>Page Not Found</h1>
          <p className={styles.subtitle}>Oops! The page you&apos;re looking for doesn&apos;t exist.</p>

          {/* 卡车加载动画 */}
          <div className={styles.truckContainer}>
            <TruckLoading size="medium" />
          </div>

          <p className={styles.description}>
            The page might have been moved or deleted. Please check the URL or go back to the homepage.
          </p>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.btnPrimary} onClick={handleBack}>
            Go Back
          </button>
          <button className={styles.btnSecondary} onClick={handleHome}>
            Go to Homepage
          </button>
        </div>
      </div>
    </main>
  );
});

NotFoundPage.displayName = "NotFoundPage";

export default NotFoundPage;
