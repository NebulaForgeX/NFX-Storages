import { AnimatedIcon, ArrowNarrowRightIcon } from "nfx-ui/icons";
import { useMemo } from "react";
import { Box, Button, Flex, Heading, Link, Text } from "@radix-ui/themes";
import { AuthSignupPlatformEnum, LanguageEnum } from "nfx-ui/enums";
import { useSendVerificationCode, useSignupWithEmail } from "nfx-ui/hooks";
import { SignupFormData, useInitSignupForm } from "nfx-ui/schemas";
import { usePreferenceStore } from "nfx-ui/stores";
import { FormProvider, SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Logo, PreferencesPopover } from "@/components";
import { routerEventEmitter } from "@/events/router";
import {
  SignupConfirmPasswordController,
  SignupEmailController,
  SignupPasswordController,
  SignupRememberController,
  SignupVerificationCodeController,
} from "@/features/account";
import { ROUTES } from "@/navigations";
import { AuthMotionRoot } from "@/pages/Account/shared/AuthChrome";

import styles from "./s.module.css";

export default function SignupPage() {
  const { t } = useTranslation("pages.Account.Signup");
  const form = useInitSignupForm();
  const signup = useSignupWithEmail();
  const sendCode = useSendVerificationCode();
  const language = usePreferenceStore((s) => s.language);

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    await signup.mutateAsync({
      email: data.email,
      password: data.password,
      verificationCode: data.verificationCode,
      lang: language ?? LanguageEnum.EN,
      rememberMe: data.rememberMe ?? false,
      signupPlatform: AuthSignupPlatformEnum.NFXSTORAGES,
    });
    routerEventEmitter.navigate({ to: ROUTES.USER_OVERVIEW, replace: true });
  };

  const email = form.watch("email");
  const code = form.watch("verificationCode");
  const password = form.watch("password");
  const step = useMemo(() => {
    if (!email) return 1;
    if (!code) return 2;
    if (!password) return 3;
    return 3;
  }, [email, code, password]);

  const steps = [
    { n: 1, label: t("stepEmail") },
    { n: 2, label: t("stepCode") },
    { n: 3, label: t("stepPassword") },
  ];

  return (
    <AuthMotionRoot className={styles.page}>
      <Box className={styles.topbar}>
        <Box className={styles.topbarPx}>
          <Box className={styles.topbarPy}>
            <Flex align="center" justify="between" gap="4">
              <Flex align="center" gap="3" minWidth="0">
                <Logo variant="plain" size="small" to={ROUTES.LOGIN} />
                <span className={styles.path} data-auth-motion>
                  {t("path")}
                </span>
              </Flex>
              <PreferencesPopover />
            </Flex>
          </Box>
        </Box>
      </Box>
      <div className={styles.body}>
        <Box asChild className={styles.steps}>
          <nav aria-label={t("pageEyebrow")}>
          <Box className={styles.stepsPx}>
            <Box className={styles.stepsPy}>
              <Flex direction="column">
                {steps.map((item) => (
                  <Box key={item.n} className={`${styles.step} ${step === item.n ? styles.stepCurrent : ""}`} data-auth-motion>
                    <Box className={styles.stepPx}>
                      <Box className={styles.stepPy}>
                        <div className={styles.stepGrid}>
                          <span className={styles.index}>{String(item.n).padStart(2, "0")}</span>
                          <Text size="2" weight={step === item.n ? "bold" : "regular"}>
                            {item.label}
                          </Text>
                        </div>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Flex>
            </Box>
          </Box>
          </nav>
        </Box>
        <Box className={styles.formPane}>
          <Box className={styles.formPanePx}>
            <Box className={styles.formPanePy}>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1" data-auth-motion>
                  <Text as="p" size="1" weight="bold" className={styles.kicker}>
                    {t("pageEyebrow")}
                  </Text>
                  <Heading as="h1" size="6">
                    {t("pageTitle")}
                  </Heading>
                  <Text as="p" size="2" color="gray">
                    {t("pageSubtitle")}
                  </Text>
                </Flex>
                <FormProvider {...form}>
                  <Flex asChild direction="column" gap="4" data-auth-motion>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
                      <SignupEmailController helperText={t("emailHint")} />
                      <Flex direction="column" gap="2">
                        <SignupVerificationCodeController />
                        <Button
                          type="button"
                          size="3"
                          variant="outline"
                          radius="none"
                          loading={sendCode.isPending}
                          disabled={!email}
                          onClick={() =>
                            email &&
                            sendCode.mutate({
                              email,
                              lang: language ?? LanguageEnum.EN,
                            })
                          }
                        >
                          {t("sendCode")}
                        </Button>
                      </Flex>
                      <SignupPasswordController />
                      <SignupConfirmPasswordController />
                      <SignupRememberController />
                      <Button type="submit" size="3" loading={signup.isPending} radius="none">
                        {t("submit")}
                        <AnimatedIcon icon={ArrowNarrowRightIcon} size={16} />
                      </Button>
                    </form>
                  </Flex>
                </FormProvider>
                <Text as="p" size="2" color="gray" data-auth-motion>
                  {t("hasAccount")}{" "}
                  <Link
                    href={ROUTES.LOGIN}
                    size="2"
                    onClick={(e) => {
                      e.preventDefault();
                      routerEventEmitter.navigate({ to: ROUTES.LOGIN });
                    }}
                  >
                    {t("signIn")}
                  </Link>
                </Text>
              </Flex>
            </Box>
          </Box>
        </Box>
        <Box className={styles.bucket} data-auth-motion>
          <Box className={styles.bucketPx}>
            <Box className={styles.bucketPy}>
              <Flex direction="column" align="center" justify="center" gap="4">
                <div className={styles.bucketGlyph} aria-hidden />
                <Text size="2" weight="bold">
                  {t("emptyBucket")}
                </Text>
                <Text size="1" color="gray" align="center">
                  {t("emptyHint")}
                </Text>
              </Flex>
            </Box>
          </Box>
        </Box>
      </div>
    </AuthMotionRoot>
  );
}
