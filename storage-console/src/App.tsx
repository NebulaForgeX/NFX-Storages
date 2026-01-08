import { Navigate, Route, Routes } from "react-router-dom";

import { TruckLoading } from "@/components";
import { LayoutSwitcher } from "@/layouts";
import {
  AccountSecurityPage,
  CategoryAddPage,
  CategoryDetailPage,
  CategoryEditPage,
  CategoryListPage,
  CategoryPanelPage,
  DashboardPage,
  LoginPage,
  NotFoundPage,
  ProfileEditPage,
  ProfilePage,
  SubcategoryAddPage,
  SubcategoryDetailPage,
  SubcategoryEditPage,
  SubcategoryListPage,
  TeaAddPage,
  TeaDetailPage,
  TeaEditPage,
  TeaListPage,
  ViewProfilePage,
} from "@/pages";
import { ROUTES } from "@/types/navigation";

import "./App.css";
import styles from "./App.module.css";

import { useRouter } from "./hooks/useRouter";
import { useAuthStore } from "./stores/authStore";
import { useAuthInit } from "./hooks/useAuthInit";
import { useCacheInvalidation } from "./hooks/useCacheInvalidation";

function App() {
  useRouter();
  useCacheInvalidation(); // 监听缓存失效事件
  const { isInitialized } = useAuthInit();
  const isAuthValid = useAuthStore((state) => state.isAuthValid);

  // 等待认证验证完成再渲染
  if (!isInitialized) {
    return (
      <div className={styles.loadingContainer}>
        <TruckLoading size="medium" />
        <p className={styles.loadingText}>验证中...</p>
      </div>
    );
  }

  if (!isAuthValid) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    );
  }

  return (
    <LayoutSwitcher>
      <Routes>
        <Route path={ROUTES.HOME} element={<DashboardPage />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        <Route path={ROUTES.EDIT_PROFILE} element={<ProfileEditPage />} />
        <Route path={ROUTES.ACCOUNT_SECURITY} element={<AccountSecurityPage />} />
        <Route path={ROUTES.VIEW_PROFILE} element={<ViewProfilePage />} />
        {/* Category routes */}
        <Route path={ROUTES.CATEGORY_LIST} element={<CategoryListPage />} />
        <Route path={ROUTES.CATEGORY_ADD} element={<CategoryAddPage />} />
        <Route path={ROUTES.CATEGORY_DETAIL} element={<CategoryDetailPage />} />
        <Route path={ROUTES.CATEGORY_EDIT} element={<CategoryEditPage />} />
        {/* Subcategory routes */}
        <Route path={ROUTES.SUBCATEGORY_LIST} element={<SubcategoryListPage />} />
        <Route path={ROUTES.SUBCATEGORY_ADD} element={<SubcategoryAddPage />} />
        <Route path={ROUTES.SUBCATEGORY_DETAIL} element={<SubcategoryDetailPage />} />
        <Route path={ROUTES.SUBCATEGORY_EDIT} element={<SubcategoryEditPage />} />
        {/* Category Panel */}
        <Route path={ROUTES.CATEGORY_PANEL} element={<CategoryPanelPage />} />
        {/* Tea routes */}
        <Route path={ROUTES.TEA_LIST} element={<TeaListPage />} />
        <Route path={ROUTES.TEA_ADD} element={<TeaAddPage />} />
        <Route path={ROUTES.TEA_DETAIL} element={<TeaDetailPage />} />
        <Route path={ROUTES.TEA_EDIT} element={<TeaEditPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </LayoutSwitcher>
  );
}


export default App;
