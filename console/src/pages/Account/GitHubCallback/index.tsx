import { useEffect, useRef } from "react";
import { Flex, Spinner, Text } from "@radix-ui/themes";
import { AuthSignupPlatformEnum } from "nfx-ui/enums";
import { systemEventEmitter } from "nfx-ui/events";
import { useLoginWithGitHub, useSelectProfile } from "nfx-ui/hooks";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import { safeArray } from "@/utils";

export default function GitHubCallbackPage() {
  const { t } = useTranslation("pages.Account.Login");
  const [params] = useSearchParams();
  const login = useLoginWithGitHub();
  const selectProfile = useSelectProfile();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = params.get("code") ?? "";
    const state = params.get("state") ?? "";
    if (!code || !state) {
      systemEventEmitter.showError(t("github.missingParams", { defaultValue: "GitHub callback is missing code or state." }));
      routerEventEmitter.navigate({ to: ROUTES.LOGIN, replace: true });
      return;
    }
    void (async () => {
      try {
        const result = await login.mutateAsync({
          code,
          state,
          signupPlatform: AuthSignupPlatformEnum.NFXSTORAGES,
        });
        const profiles = safeArray(result?.profiles);
        if (profiles.length === 1 && profiles[0]) {
          await selectProfile.mutateAsync({
            profileId: profiles[0].profileId,
            kind: profiles[0].kind,
          });
          routerEventEmitter.navigate({ to: ROUTES.USER_OVERVIEW, replace: true });
          return;
        }
        routerEventEmitter.navigate({ to: ROUTES.LOGIN, replace: true });
      } catch {
        routerEventEmitter.navigate({ to: ROUTES.LOGIN, replace: true });
      }
    })();
  }, [login, params, selectProfile, t]);

  return (
    <Flex align="center" justify="center" minHeight="100dvh">
      <Flex direction="column" align="center" gap="3">
        <Spinner size="3" />
        <Text size="2" color="gray">
          {t("github.completing", { defaultValue: "Completing GitHub sign-in…" })}
        </Text>
      </Flex>
    </Flex>
  );
}
