import { AnimatedIcon, ArrowNarrowRightIcon, RightChevron, EyeIcon, EyeOffIcon, ShieldCheck, UsersIcon } from "nfx-ui/icons";
import type { Login } from "nfx-ui/types";

import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Checkbox, Flex, Heading, Link, Spinner, Text, TextField } from "@radix-ui/themes";
import { APP_NAME } from "nfx-ui/config";
import { ProfileKindEnum } from "nfx-ui/enums";
import { useLoginWithEmail, useSelectProfile } from "nfx-ui/hooks";
import { LoginFormData, useInitLoginForm } from "nfx-ui/schemas";
import { Controller, FormProvider, SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Logo } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import { AuthMotionRoot, AuthToolbar } from "@/pages/Account/shared/AuthChrome";
import { buildImageUrl, resolveAccountDisplayName, resolveAccountInitial, safeArray, safeOr, safeStringable } from "@/utils";

import styles from "./s.module.css";

export default function LoginPage() {
  const { t } = useTranslation("pages.Account.Login");
  const rack = useTranslation("pages.Account.AuthShell");
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
  const bays = [
    { name: rack.t("bucketLogs"), objects: rack.t("bucketLogsCount"), status: "online" as const },
    { name: rack.t("bucketArtifacts"), objects: rack.t("bucketArtifactsCount"), status: "online" as const },
    { name: rack.t("bucketBackups"), objects: rack.t("bucketBackupsCount"), status: "locked" as const },
  ];

  return (
    <AuthMotionRoot className={styles.page}>
      <aside className={styles.rack}>
        <div className={styles.rackBrand} data-auth-motion>
          <Logo variant="plain" size="small" to={ROUTES.LOGIN} title={rack.t("productName")} />
          <span className={styles.path}>{rack.t("productPath")}</span>
        </div>
        <div className={styles.meter} data-auth-motion>
          <Flex justify="between">
            <Text size="1" color="gray">
              {rack.t("capacityLabel")}
            </Text>
            <Text size="1" weight="bold">
              {rack.t("capacityValue")}
            </Text>
          </Flex>
          <div className={styles.meterTrack} aria-hidden>
            <div className={styles.meterFill} />
          </div>
          <Text size="1" color="gray">
            {rack.t("capacityHint")}
          </Text>
        </div>
        <table className={styles.bayTable} data-auth-motion>
          <caption className={styles.visuallyHidden}>{rack.t("rackTitle")}</caption>
          <thead>
            <tr>
              <th>{rack.t("bucketCol")}</th>
              <th>{rack.t("objectsCol")}</th>
              <th>{rack.t("statusCol")}</th>
            </tr>
          </thead>
          <tbody>
            {bays.map((bay) => (
              <tr key={bay.name}>
                <td>{bay.name}</td>
                <td>{bay.objects}</td>
                <td className={bay.status === "online" ? styles.statusOn : styles.statusLock}>
                  {rack.t(bay.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Text size="2" color="gray" data-auth-motion>
          {rack.t("summary")}
        </Text>
      </aside>

      <section className={styles.session}>
        <AuthToolbar />
        <div className={styles.sessionBody}>
          <div className={styles.strip}>
            {selecting ? (
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1" data-auth-motion>
                  <Text as="p" size="1" weight="bold" className={styles.kicker}>
                    {t("selectProfile.eyebrow")}
                  </Text>
                  <Heading as="h1" size="5">
                    {t("selectProfile.title")}
                  </Heading>
                  <Text as="p" size="2" color="gray">
                    {t("selectProfile.subtitle")}
                  </Text>
                </Flex>
                {profileGroups.map((group) => {
                  const isAuthority = group.kind === ProfileKindEnum.AUTHORITY;
                  const kindLabel = t(`selectProfile.kind.${group.kind}`);
                  return (
                    <Flex key={group.kind} direction="column" gap="1" data-auth-motion>
                      <Flex align="center" gap="2">
                        <AnimatedIcon icon={isAuthority ? ShieldCheck : UsersIcon} size={14} />
                        <Text size="2" weight="bold">
                          {kindLabel}
                        </Text>
                      </Flex>
                      {group.items.map((profile) => {
                        const name = resolveAccountDisplayName(profile.displayName, profile.profileId);
                        const initial = resolveAccountInitial(profile.displayName, profile.profileId);
                        const roles = safeArray(profile.roles);
                        const place = [safeStringable(profile.city), safeStringable(profile.country)].filter(Boolean).join(", ");
                        return (
                          <button
                            key={`${profile.kind}:${profile.profileId}`}
                            type="button"
                            className={styles.profileRow}
                            disabled={selectProfile.isPending}
                            onClick={async () => {
                              await selectProfile.mutateAsync({
                                profileId: profile.profileId,
                                kind: profile.kind ?? ProfileKindEnum.FORGER,
                              });
                              routerEventEmitter.navigate({ to: ROUTES.USER_OVERVIEW, replace: true });
                            }}
                          >
                            <Avatar size="2" radius="none" fallback={initial} src={profile.avatarImageId ? buildImageUrl(profile.avatarImageId) : undefined} />
                            <div className={styles.profileMeta}>
                              <Flex align="center" gap="2" wrap="wrap">
                                <Text size="2" weight="bold">
                                  {name}
                                </Text>
                                <Badge color={isAuthority ? "amber" : undefined} variant="soft" size="1">
                                  {kindLabel}
                                </Badge>
                              </Flex>
                              <Text size="1" color="gray">
                                {place || roles.map((role) => t(`selectProfile.roles.${role}`, { defaultValue: role })).join(" · ") || kindLabel}
                              </Text>
                            </div>
                            {selectProfile.isPending ? <Spinner size="2" /> : <AnimatedIcon icon={RightChevron} size={16} />}
                          </button>
                        );
                      })}
                    </Flex>
                  );
                })}
                <Button type="button" variant="ghost" size="2" onClick={() => setProfiles([])} disabled={selectProfile.isPending}>
                  {t("selectProfile.back")}
                </Button>
              </Flex>
            ) : (
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1" data-auth-motion>
                  <Text as="p" size="1" weight="bold" className={styles.kicker}>
                    {rack.t("session")}
                  </Text>
                  <Heading as="h1" size="5">
                    {t("form.title", { name: APP_NAME })}
                  </Heading>
                  <Text as="p" size="2" color="gray">
                    {t("form.subtitle")}
                  </Text>
                </Flex>
                <FormProvider {...form}>
                  <Flex asChild direction="column" gap="3" data-auth-motion>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
                      <Controller
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Flex direction="column" gap="1">
                            <Text as="label" size="2" weight="medium" htmlFor="login-email">
                              {t("form.emailLabel")}
                            </Text>
                            <TextField.Root id="login-email" size="3" type="email" autoComplete="email" placeholder={t("form.emailPlaceholder")} radius="none" {...field} />
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
                                  aria-label={showPassword ? t("form.hidePassword") : t("form.showPassword")}
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
                      <Button type="submit" size="3" loading={login.isPending} radius="none" style={{ width: "100%" }}>
                        {t("form.submit")}
                        <AnimatedIcon icon={ArrowNarrowRightIcon} size={16} />
                      </Button>
                    </form>
                  </Flex>
                </FormProvider>
                <Text as="p" size="2" color="gray" data-auth-motion>
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
          </div>
        </div>
      </section>
    </AuthMotionRoot>
  );
}
