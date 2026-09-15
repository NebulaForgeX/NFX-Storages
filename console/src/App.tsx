import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useAuthStore, hasSelectedProfile } from "nfx-ui/stores";

import { ConsoleLayout } from "@/layouts";
import { ROUTES } from "@/navigations";
import { AuthStore as S3AuthStore, useAuthStore as useS3AuthStore } from "@/stores/authStore";
import { configManager } from "@/utils/config";

import LoginPage from "@/pages/LoginPage";
import SelectProfilePage from "@/pages/SelectProfilePage";
import ConfigPage from "@/pages/ConfigPage";
import BrowserPage from "@/pages/BrowserPage";
import ObjectBrowserPage from "@/pages/BrowserPage/ObjectBrowserPage";
import BucketsPage from "@/pages/BucketsPage";
import UsersPage from "@/pages/UsersPage";
import UserGroupsPage from "@/pages/UserGroupsPage";
import PoliciesPage from "@/pages/PoliciesPage";
import AccessKeysPage from "@/pages/AccessKeysPage";
import LifecyclePage from "@/pages/LifecyclePage";
import ReplicationPage from "@/pages/ReplicationPage";
import EventsPage from "@/pages/EventsPage";
import EventsTargetPage from "@/pages/EventsTargetPage";
import TiersPage from "@/pages/TiersPage";
import SsePage from "@/pages/SsePage";
import ImportExportPage from "@/pages/ImportExportPage";
import PerformancePage from "@/pages/PerformancePage";
import LicensePage from "@/pages/LicensePage";
import SettingsPage from "@/pages/User/Settings";
import NotFoundPage from "@/pages/NotFoundPage";

async function issueS3Credentials(accessToken: string) {
  const site = await configManager.loadConfig();
  const res = await fetch(`${site.api.baseURL}/session/credentials`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("session credentials failed");
  const data = (await res.json()) as {
    AccessKeyId?: string;
    SecretAccessKey?: string;
    SessionToken?: string;
    Expiration?: string;
  };
  S3AuthStore.getState().setCredentials({
    AccessKeyId: data.AccessKeyId,
    SecretAccessKey: data.SecretAccessKey,
    SessionToken: data.SessionToken,
    Expiration: data.Expiration,
  });
}

function App() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const profileId = useAuthStore((state) => state.currentProfileId);
  const isIdentityValid = useAuthStore((state) => state.isAuthValid);
  const s3Valid = useS3AuthStore((state) => state.isAuthValid);
  const [credError, setCredError] = useState("");

  useEffect(() => {
    if (!accessToken || !hasSelectedProfile(profileId) || s3Valid) return;
    void issueS3Credentials(accessToken).catch((err: unknown) => {
      setCredError(err instanceof Error ? err.message : "credentials");
    });
  }, [accessToken, profileId, s3Valid]);

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
