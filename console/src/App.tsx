import { useEffect, useState } from "react";
import { GuestRoute, ProtectedRoute } from "nfx-ui/navigations";
import { Navigate, Outlet, Route, Routes } from "react-router";
import { useAuthStore } from "nfx-ui/stores";

import { authRepository } from "@/apis/repositories";
import { Main, Sidebar } from "@/layouts";
import { ROUTES } from "@/navigations";
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
  ProfileEditPage,
  ProfileIdentitiesPage,
  ProfileOverviewPage,
  ReplicationPage,
  SettingsPage,
  SignupPage,
  SsePage,
  TiersPage,
  UserGroupsPage,
  UsersPage,
} from "@/pages";
import { useAuthStore as useS3AuthStore } from "@/stores/authStore";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

function S3SessionGate() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const profileId = useAuthStore((state) => state.currentProfileId);
  const s3Valid = useS3AuthStore((state) => state.isAuthValid);
  const [credError, setCredError] = useState("");

  useEffect(() => {
    if (!accessToken || !profileId || s3Valid) return;
    void authRepository.issueSessionCredentials().catch((err: unknown) => {
      setCredError(getStoragesApiErrorMessage(err, "credentials"));
    });
  }, [accessToken, profileId, s3Valid]);

  if (!s3Valid) {
    return <div style={{ padding: 24 }}>{credError || "Issuing S3 credentials…"}</div>;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Main />}>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Route>

      <Route element={<ProtectedRoute redirectTo={ROUTES.LOGIN} />}>
        <Route element={<S3SessionGate />}>
          <Route element={<Sidebar />}>
            <Route path={ROUTES.USER} element={<Navigate to={ROUTES.BROWSER} replace />} />
            <Route path={ROUTES.USER_OVERVIEW} element={<Navigate to={ROUTES.BROWSER} replace />} />
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
            <Route path={ROUTES.PROFILE} element={<Navigate to={ROUTES.USER_PROFILE_OVERVIEW} replace />} />
            <Route path={ROUTES.USER_PROFILE_OVERVIEW} element={<ProfileOverviewPage />} />
            <Route path={ROUTES.USER_PROFILE_EDIT} element={<ProfileEditPage />} />
            <Route path={ROUTES.USER_PROFILE_IDENTITIES} element={<ProfileIdentitiesPage />} />
            <Route path={ROUTES.USER_SETTINGS} element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<GuestRoute redirectTo={ROUTES.BROWSER} />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
        <Route path={ROUTES.CONFIG} element={<ConfigPage />} />
      </Route>

      <Route path={ROUTES.LOGIN_GITHUB_CALLBACK} element={<GitHubCallbackPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
