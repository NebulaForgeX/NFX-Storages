import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { useAuthStore, hasSelectedProfile } from "nfx-ui/stores";

import { ConsoleLayout } from "@/layouts";
import { ROUTES } from "@/navigations";
import { useAuthStore as useS3AuthStore } from "@/stores/authStore";
import { authRepository } from "@/apis/repositories";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import {
  AccessKeysPage,
  BrowserPage,
  BucketsPage,
  ConfigPage,
  EventsPage,
  EventsTargetPage,
  GitHubCallbackPage,
  ImportExportPage,
  LicensePage,
  LifecyclePage,
  LoginPage,
  NotFoundPage,
  ObjectBrowserPage,
  PerformancePage,
  PoliciesPage,
  PoolsPage,
  ReplicationPage,
  SelectProfilePage,
  SettingsPage,
  SsePage,
  TiersPage,
  UserGroupsPage,
  UsersPage,
} from "@/pages";

function App() {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const profileId = useAuthStore((state) => state.currentProfileId);
  const isIdentityValid = useAuthStore((state) => state.isAuthValid);
  const s3Valid = useS3AuthStore((state) => state.isAuthValid);
  const [credError, setCredError] = useState("");

  useEffect(() => {
    if (!accessToken || !hasSelectedProfile(profileId) || s3Valid) return;
    void authRepository.issueSessionCredentials().catch((err: unknown) => {
      setCredError(getStoragesApiErrorMessage(err, "credentials"));
    });
  }, [accessToken, profileId, s3Valid]);

  if (location.pathname === ROUTES.LOGIN_GITHUB_CALLBACK) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN_GITHUB_CALLBACK} element={<GitHubCallbackPage />} />
      </Routes>
    );
  }

  if (!accessToken) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.CONFIG} element={<ConfigPage />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    );
  }

  if (!isIdentityValid || !hasSelectedProfile(profileId)) {
    return (
      <Routes>
        <Route path={ROUTES.SELECT_PROFILE} element={<SelectProfilePage />} />
        <Route path="*" element={<Navigate to={ROUTES.SELECT_PROFILE} replace />} />
      </Routes>
    );
  }

  if (!s3Valid) {
    return (
      <Routes>
        <Route path="*" element={<div style={{ padding: 24 }}>{credError || "Issuing S3 credentials…"}</div>} />
      </Routes>
    );
  }

  return (
    <ConsoleLayout>
      <Routes>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BROWSER} replace />} />
        <Route path={ROUTES.BROWSER} element={<BrowserPage />} />
        <Route path="/browser/:bucket" element={<ObjectBrowserPage />} />
        <Route path="/browser/:bucket/:key" element={<ObjectBrowserPage />} />
        <Route path="/buckets/:key" element={<BucketsPage />} />
        <Route path={ROUTES.ACCESS_KEYS} element={<AccessKeysPage />} />
        <Route path={ROUTES.POLICIES} element={<PoliciesPage />} />
        <Route path={ROUTES.USERS} element={<UsersPage />} />
        <Route path={ROUTES.USER_GROUPS} element={<UserGroupsPage />} />
        <Route path={ROUTES.IMPORT_EXPORT} element={<ImportExportPage />} />
        <Route path={ROUTES.PERFORMANCE} element={<PerformancePage />} />
        <Route path={ROUTES.POOLS} element={<PoolsPage />} />
        <Route path={ROUTES.EVENTS} element={<EventsPage />} />
        <Route path={ROUTES.REPLICATION} element={<ReplicationPage />} />
        <Route path={ROUTES.LIFECYCLE} element={<LifecyclePage />} />
        <Route path={ROUTES.TIERS} element={<TiersPage />} />
        <Route path={ROUTES.EVENTS_TARGET} element={<EventsTargetPage />} />
        <Route path={ROUTES.SSE} element={<SsePage />} />
        <Route path={ROUTES.LICENSE} element={<LicensePage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ConsoleLayout>
  );
}

export default App;
