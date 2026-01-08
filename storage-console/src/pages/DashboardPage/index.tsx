import { memo } from "react";
import { Edit } from "@/assets/icons/lucide";

import QuickStore, { useQuickStore } from "@/stores/quickStore";
import { Suspense } from "@/components";

import { StatsCards, QuickNavigation, ResourceLinks } from "./components";
import styles from "./styles.module.css";

const DashboardPage = memo(() => {
  const isEditMode = useQuickStore((state) => state.isEditMode);
  const toggleEditMode = QuickStore.getState().toggleEditMode;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>仪表盘</h1>
        <button
          className={styles.editButton}
          onClick={toggleEditMode}
          aria-label={isEditMode ? "退出编辑模式" : "编辑快速导航"}
          title={isEditMode ? "退出编辑模式" : "编辑快速导航"}
        >
          <Edit size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <Suspense
        loadingType="ecg"
        loadingText="加载统计数据..."
        loadingSize="small"
        loadingContainerClassName={styles.loading}
      >
        <StatsCards />
      </Suspense>

      {/* Quick Navigation */}
      <QuickNavigation />

      {/* Resources & Policies Section */}
      <ResourceLinks />
    </div>
  );
});

DashboardPage.displayName = "DashboardPage";

export default DashboardPage;
