import type { Login } from "nfx-ui/types";

import { useMemo, useState } from "react";
import { Avatar, Badge, Box, Button, Card, Checkbox, Flex, Heading, Link, Separator, Spinner, Text, TextField } from "@radix-ui/themes";
import { ArrowRight, ChevronRight, Eye, EyeOff, Shield, Users } from "lucide-react";
import { APP_NAME } from "nfx-ui/config";
import { ProfileKindEnum } from "nfx-ui/enums";
import { useLoginWithEmail, useSelectProfile } from "nfx-ui/hooks";
import { LoginFormData, useInitLoginForm } from "nfx-ui/schemas";
import { Controller, FormProvider, SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import AuthShell from "@/pages/Auth/shared/AuthShell";
import { buildImageUrl, resolveAccountDisplayName, resolveAccountInitial, safeArray, safeOr, safeStringable } from "@/utils";

import styles from "./s.module.css";

export default function LoginPage() {
  const { t } = useTranslation("pages.Account.Login");
  const form = useInitLoginForm();
  const login = useLoginWithEmail();
  const selectProfile = useSelectProfile();
  const [profiles, setProfiles] = useState<Login.ProfileItem[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    const result = await login.mutateAsync({
      email: data.email,
      password: data.password,
      rememberMe: safeOr(data.rememberMe, false),
    });
    const list = safeArray(result?.profiles);
    if (list.length > 0) {
      setProfiles(list);
      return;
    }
    routerEventEmitter.navigate({ to: ROUTES.USER_OVERVIEW, replace: true });
  };

  const profileGroups = useMemo(() => {
    const forger = profiles.filter((p) => p.kind === ProfileKindEnum.FORGER);
    const authority = profiles.filter((p) => p.kind === ProfileKindEnum.AUTHORITY);
    return [
      { kind: ProfileKindEnum.FORGER as const, items: forger },
      { kind: ProfileKindEnum.AUTHORITY as const, items: authority },
    ].filter((group) => group.items.length > 0);
  }, [profiles]);

  const selecting = profiles.length > 0;

  return (
    <AuthShell brandEyebrow={t("brand.access", { name: APP_NAME })} brandTitle={t("brand.title")} heroFooter={t("heroFooter")}>
      {selecting ? (
        <Flex direction="column" gap="5">
          <Flex direction="column" gap="1" className="js-auth-stagger">
            <Text as="p" size="1" weight="bold" className={styles.kicker}>
              {t("selectProfile.eyebrow")}
            </Text>
            <Heading as="h2" size="6">
              {t("selectProfile.title")}
            </Heading>
            <Text as="p" size="2" color="gray">
              {t("selectProfile.subtitle")}
            </Text>
          </Flex>

          <Flex direction="column" gap="4" className="js-auth-stagger">
            {profileGroups.map((group) => {
              const isAuthority = group.kind === ProfileKindEnum.AUTHORITY;
              const kindLabel = t(`selectProfile.kind.${group.kind}`);
              return (
                <Flex key={group.kind} direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <LucideIcon icon={isAuthority ? Shield : Users} size={15} />
                    <Text size="2" weight="bold">
                      {kindLabel}
                    </Text>
                    <Text size="1" color="gray">
                      {t(`selectProfile.kindHint.${group.kind}`)}
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="2">
                    {group.items.map((profile) => {
                      const name = resolveAccountDisplayName(profile.displayName, profile.profileId);
                      const initial = resolveAccountInitial(profile.displayName, profile.profileId);
                      const roles = safeArray(profile.roles);
                      const place = [safeStringable(profile.city), safeStringable(profile.country)].filter(Boolean).join(", ");
                      return (
                        <Card
                          key={`${profile.kind}:${profile.profileId}`}
                          asChild
                          size="2"
                          className={`${styles.profileOption} ${isAuthority ? styles.profileOptionAuthority : styles.profileOptionCommunity}`}
                        >
                          <button
                            type="button"
                            disabled={selectProfile.isPending}
                            onClick={async () => {
                              await selectProfile.mutateAsync({
                                profileId: profile.profileId,
                                kind: profile.kind ?? ProfileKindEnum.FORGER,
                              });
                              routerEventEmitter.navigate({
                                to: ROUTES.USER_OVERVIEW,
                                replace: true,
                              });
                            }}
                          >
                            <Flex align="start" gap="3" width="100%" minWidth="0">
                              <Avatar size="3" radius="medium" fallback={initial} src={profile.avatarImageId ? buildImageUrl(profile.avatarImageId) : undefined} />
                              <Flex direction="column" gap="1" flexGrow="1" minWidth="0">
                                <Flex align="center" gap="2" wrap="wrap">
                                  <Badge color={isAuthority ? "amber" : undefined} variant="soft" size="1">
                                    {kindLabel}
                                  </Badge>
                                  {place ? (
                                    <Text size="1" color="gray">
                                      {place}
                                    </Text>
                                  ) : null}
                                </Flex>
                                <Text size="3" weight="bold">
                                  {name}
                                </Text>
                                {roles.length > 0 ? (
                                  <Flex wrap="wrap" gap="1">
                                    {roles.map((role) => (
                                      <Badge key={role} variant="soft" size="1">
                                        {t(`selectProfile.roles.${role}`, { defaultValue: role })}
                                      </Badge>
                                    ))}
                                  </Flex>
                                ) : null}
                              </Flex>
                              <Box flexShrink="0" pt="1">
                                {selectProfile.isPending ? <Spinner size="2" /> : <LucideIcon icon={ChevronRight} size={18} />}
                              </Box>
                            </Flex>
                          </button>
                        </Card>
                      );
                    })}
                  </Flex>
                </Flex>
              );
            })}
          </Flex>

          <Separator size="4" />
          <Flex justify="center" className="js-auth-stagger">
            <Button type="button" variant="soft" color="gray" size="2" onClick={() => setProfiles([])} disabled={selectProfile.isPending}>
              {t("selectProfile.back")}
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Flex direction="column" gap="5">
          <Flex direction="column" gap="1" className="js-auth-stagger">
            <Text as="p" size="1" weight="bold" className={styles.kicker}>
              {t("form.welcomeBack")}
            </Text>
            <Heading as="h2" size="6">
              {t("form.title", { name: APP_NAME })}
            </Heading>
            <Text as="p" size="2" color="gray">
              {t("form.subtitle")}
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
                      <Text as="label" size="2" weight="medium" htmlFor="login-email">
                        {t("form.emailLabel")}
                      </Text>
                      <TextField.Root id="login-email" size="3" type="email" autoComplete="email" placeholder={t("form.emailPlaceholder")} {...field} />
                      {fieldState.error ? (
                        <Text size="1" color="red">
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </Flex>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="medium" htmlFor="login-password">
                        {t("form.passwordLabel")}
                      </Text>
                      <TextField.Root
                        id="login-password"
                        size="3"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder={t("form.passwordPlaceholder")}
                        {...field}
                      >
                        <TextField.Slot side="right">
                          <Button
                            type="button"
                            size="1"
                            variant="soft"
                            color="gray"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? t("form.hidePassword") : t("form.showPassword")}
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

                <Flex align="center" justify="between" gap="2" wrap="wrap">
                  <Controller
                    name="rememberMe"
                    control={form.control}
                    render={({ field }) => (
                      <Flex asChild align="center" gap="2">
                        <Text as="label" size="2">
                          <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                          {t("form.rememberMe")}
                        </Text>
                      </Flex>
                    )}
                  />
                </Flex>

                <Button type="submit" size="3" loading={login.isPending} style={{ width: "100%" }}>
                  {t("form.submit")}
                  <LucideIcon icon={ArrowRight} size={16} />
                </Button>
              </form>
            </Flex>
          </FormProvider>

          <Separator size="4" className="js-auth-stagger" />

          <Text as="p" size="2" align="center" color="gray" className="js-auth-stagger">
            {t("promo.newTo", { name: APP_NAME })}{" "}
            <Link
              href={ROUTES.SIGNUP}
              size="2"
              onClick={(e) => {
                e.preventDefault();
                routerEventEmitter.navigate({ to: ROUTES.SIGNUP });
              }}
            >
              {t("promo.createAccount")}
            </Link>
          </Text>
        </Flex>
      )}
    </AuthShell>
  );
}
