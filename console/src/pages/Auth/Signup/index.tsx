import { useState } from "react";
import { Button, Checkbox, Flex, Heading, Link, Separator, Text, TextField } from "@radix-ui/themes";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { APP_NAME } from "nfx-ui/config";
import { AuthSignupPlatformEnum, LanguageEnum } from "nfx-ui/enums";
import { useSendVerificationCode, useSignupWithEmail } from "nfx-ui/hooks";
import { SignupFormData, useInitSignupForm } from "nfx-ui/schemas";
import { usePreferenceStore } from "nfx-ui/stores";
import { Controller, FormProvider, SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import AuthShell from "@/pages/Auth/shared/AuthShell";

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

  return (
    <AuthShell brandEyebrow={t("brand.access", { name: APP_NAME })} brandTitle={t("brand.title")} heroFooter={t("heroFooter")}>
      <Flex direction="column" gap="5">
        <Flex direction="column" gap="1" className="js-auth-stagger">
          <Text as="p" size="1" weight="bold" className={styles.kicker}>
            {t("pageEyebrow")}
          </Text>
          <Heading as="h2" size="6">
            {t("pageTitle", { name: APP_NAME })}
          </Heading>
          <Text as="p" size="2" color="gray">
            {t("pageSubtitle")}
          </Text>
        </Flex>

        <FormProvider {...form}>
          <Flex asChild direction="column" gap="4" className="js-auth-stagger">
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium" htmlFor="signup-email">
                      {t("emailLabel")}
                    </Text>
                    <TextField.Root id="signup-email" size="3" type="email" autoComplete="email" placeholder={t("emailPlaceholder")} {...field} />
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
                    render={({ field }) => <TextField.Root id="signup-code" size="3" placeholder={t("codePlaceholder")} style={{ flex: 1 }} {...field} />}
                  />
                  <Button
                    type="button"
                    size="3"
                    variant="soft"
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
                      {...field}
                    >
                      <TextField.Slot side="right">
                        <Button
                          type="button"
                          size="1"
                          variant="soft"
                          color="gray"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                        >
                          <LucideIcon icon={showPassword ? EyeOff : Eye} size={14} />
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
                      {...field}
                    >
                      <TextField.Slot side="right">
                        <Button
                          type="button"
                          size="1"
                          variant="soft"
                          color="gray"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
                        >
                          <LucideIcon icon={showConfirm ? EyeOff : Eye} size={14} />
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

              <Button type="submit" size="3" loading={signup.isPending} style={{ width: "100%" }}>
                {t("submit")}
                <LucideIcon icon={ArrowRight} size={16} />
              </Button>
            </form>
          </Flex>
        </FormProvider>

        <Separator size="4" className="js-auth-stagger" />

        <Text as="p" size="2" align="center" color="gray" className="js-auth-stagger">
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
    </AuthShell>
  );
}
