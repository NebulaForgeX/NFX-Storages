import { AnimatedIcon, ArrowNarrowRightIcon, EyeIcon, EyeOffIcon } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { Button, Checkbox, Flex, Heading, Link, Text, TextField } from "@radix-ui/themes";
import { AuthSignupPlatformEnum, LanguageEnum } from "nfx-ui/enums";
import { useSendVerificationCode, useSignupWithEmail } from "nfx-ui/hooks";
import { SignupFormData, useInitSignupForm } from "nfx-ui/schemas";
import { usePreferenceStore } from "nfx-ui/stores";
import { Controller, FormProvider, SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Logo, PreferencesPopover } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import { AuthMotionRoot } from "@/pages/Account/shared/AuthChrome";

import styles from "./s.module.css";

export default function SignupPage() {
  const { t } = useTranslation("pages.Account.Signup");
  const form = useInitSignupForm();
  const signup = useSignupWithEmail();
  const sendCode = useSendVerificationCode();
  const language = usePreferenceStore((s) => s.language);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      <header className={styles.topbar}>
        <Flex align="center" gap="3" minWidth="0">
          <Logo variant="plain" size="small" to={ROUTES.LOGIN} />
          <span className={styles.path} data-auth-motion>
            {t("path")}
          </span>
        </Flex>
        <PreferencesPopover />
      </header>
      <div className={styles.body}>
        <nav className={styles.steps} aria-label={t("pageEyebrow")}>
          {steps.map((item) => (
            <div key={item.n} className={`${styles.step} ${step === item.n ? styles.stepCurrent : ""}`} data-auth-motion>
              <span className={styles.index}>{String(item.n).padStart(2, "0")}</span>
              <Text size="2" weight={step === item.n ? "bold" : "regular"}>
                {item.label}
              </Text>
            </div>
          ))}
        </nav>
        <div className={styles.formPane}>
          <Flex direction="column" gap="1" style={{ marginBottom: 16 }} data-auth-motion>
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
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="medium" htmlFor="signup-email">
                        {t("emailLabel")}
                      </Text>
                      <TextField.Root id="signup-email" size="3" type="email" autoComplete="email" placeholder={t("emailPlaceholder")} radius="none" {...field} />
                      <Text size="1" color="gray">
                        {t("emailHint")}
                      </Text>
                      {fieldState.error ? (
                        <Text size="1" color="red">
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </Flex>
                  )}
                />
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium" htmlFor="signup-code">
                    {t("codeLabel")}
                  </Text>
                  <Flex gap="2">
                    <Controller
                      name="verificationCode"
                      control={form.control}
                      render={({ field }) => (
                        <TextField.Root id="signup-code" size="3" placeholder={t("codePlaceholder")} radius="none" style={{ flex: 1 }} {...field} />
                      )}
                    />
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
                </Flex>
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="medium" htmlFor="signup-password">
                        {t("passwordLabel")}
                      </Text>
                      <TextField.Root
                        id="signup-password"
                        size="3"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t("passwordPlaceholder")}
                        radius="none"
                        {...field}
                      >
                        <TextField.Slot side="right">
                          <Button
                            type="button"
                            size="1"
                            variant="ghost"
                            color="gray"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                          >
                            <AnimatedIcon icon={showPassword ? EyeOffIcon : EyeIcon} size={14} />
                          </Button>
                        </TextField.Slot>
                      </TextField.Root>
                      {fieldState.error ? (
                        <Text size="1" color="red">
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </Flex>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="medium" htmlFor="signup-confirm">
                        {t("confirmLabel")}
                      </Text>
                      <TextField.Root
                        id="signup-confirm"
                        size="3"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t("confirmPlaceholder")}
                        radius="none"
                        {...field}
                      >
                        <TextField.Slot side="right">
                          <Button
                            type="button"
                            size="1"
                            variant="ghost"
                            color="gray"
                            onClick={() => setShowConfirm((v) => !v)}
                            aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
                          >
                            <AnimatedIcon icon={showConfirm ? EyeOffIcon : EyeIcon} size={14} />
                          </Button>
                        </TextField.Slot>
                      </TextField.Root>
                      {fieldState.error ? (
                        <Text size="1" color="red">
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </Flex>
                  )}
                />
                <Controller
                  name="rememberMe"
                  control={form.control}
                  render={({ field }) => (
                    <Flex asChild align="center" gap="2">
                      <Text as="label" size="2">
                        <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                        {t("rememberMe")}
                      </Text>
                    </Flex>
                  )}
                />
                <Button type="submit" size="3" loading={signup.isPending} radius="none">
                  {t("submit")}
                  <AnimatedIcon icon={ArrowNarrowRightIcon} size={16} />
                </Button>
              </form>
            </Flex>
          </FormProvider>
          <Text as="p" size="2" color="gray" style={{ marginTop: 16 }} data-auth-motion>
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
        </div>
        <aside className={styles.bucket} data-auth-motion>
          <div className={styles.bucketGlyph} aria-hidden />
          <Text size="2" weight="bold">
            {t("emptyBucket")}
          </Text>
          <Text size="1" color="gray" align="center">
            {t("emptyHint")}
          </Text>
        </aside>
      </div>
    </AuthMotionRoot>
  );
}
