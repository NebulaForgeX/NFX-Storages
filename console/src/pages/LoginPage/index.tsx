import { useState } from "react";
import { Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AuthSignupPlatformEnum, LanguageEnum } from "nfx-ui/enums";
import { useAuthRepository } from "nfx-ui/apis";
import { AuthStore, ensureDeviceIdStorage } from "nfx-ui/stores";

import { authEventEmitter, authEvents } from "@/events/auth";
import AuthShell from "./AuthShell";

export default function LoginPage() {
  const { t } = useTranslation("LoginPage");
  const auth = useAuthRepository();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const login = useMutation({
    mutationFn: async () => {
      const deviceId = await ensureDeviceIdStorage();
      const response = await auth.LoginWithEmail({ email, password, deviceId });
      AuthStore.getState().setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
      AuthStore.getState().setCurrentAccountId(response.accountId);
      sessionStorage.setItem("nfx-login-profiles", JSON.stringify(response.profiles ?? []));
      authEventEmitter.emit(authEvents.LOGIN_SUCCESS);
      return response;
    },
  });

  const sendCode = useMutation({
    mutationFn: async () => auth.SendVerificationCode({ email, lang: LanguageEnum.ZH }),
  });

  const signup = useMutation({
    mutationFn: async () => {
      const deviceId = await ensureDeviceIdStorage();
      const response = await auth.SignupWithEmail({
        email,
        password,
        verificationCode: code,
        lang: LanguageEnum.ZH,
        deviceId,
        signupPlatform: AuthSignupPlatformEnum.NFXSTORAGES,
      });
      AuthStore.getState().setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
      AuthStore.getState().setCurrentAccountId(response.accountId);
      authEventEmitter.emit(authEvents.LOGIN_SUCCESS);
      return response;
    },
  });

  const github = useMutation({
    mutationFn: async () => auth.GetGitHubAuthorizeUrl(),
    onSuccess: (data) => {
      if (data.authorizeUrl) window.location.href = data.authorizeUrl;
    },
  });

  const pending = login.isPending || signup.isPending;
  const error = (login.error || signup.error || sendCode.error || github.error) as Error | null;

  return (
    <AuthShell brandEyebrow="NFX Storages" brandTitle={t("title")} heroFooter={t("subtitle")}>
      <Flex direction="column" gap="5" className="js-auth-stagger">
        <Flex direction="column" gap="1">
          <Heading as="h2" size="6">
            {isRegister ? t("register") : t("login")}
          </Heading>
          <Text as="p" size="2" color="gray">
            {t("subtitle")}
          </Text>
        </Flex>
        <Flex direction="column" gap="3">
          <TextField.Root type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} />
          <TextField.Root type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")} />
          {isRegister ? (
            <Flex gap="2">
              <TextField.Root value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("verificationCode")} />
              <Button type="button" variant="soft" onClick={() => sendCode.mutate()} loading={sendCode.isPending} disabled={!email}>
                {t("sendCode")}
              </Button>
            </Flex>
          ) : null}
          {error ? (
            <Text size="2" color="red">
              {error.message}
            </Text>
          ) : null}
          <Button
            size="3"
            loading={pending}
            onClick={() => {
              if (isRegister) void signup.mutateAsync();
              else void login.mutateAsync();
            }}
          >
            {isRegister ? t("register") : t("login")}
          </Button>
          <Button type="button" variant="outline" onClick={() => github.mutate()} loading={github.isPending}>
            GitHub
          </Button>
        </Flex>
        <Text as="p" size="2" align="center" color="gray">
          {isRegister ? t("hasAccount") : t("noAccount")}{" "}
          <Button type="button" variant="ghost" size="1" onClick={() => setIsRegister((v) => !v)}>
            {isRegister ? t("signInNow") : t("registerNow")}
          </Button>
        </Text>
      </Flex>
    </AuthShell>
  );
}
