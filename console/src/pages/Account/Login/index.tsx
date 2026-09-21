import { AnimatedIcon, ArrowNarrowRightIcon, RightChevron, ShieldCheck, UsersIcon } from "nfx-ui/icons";
import type { Login } from "nfx-ui/types";

import { useMemo, useState } from "react";
import { Avatar, Badge, Box, Button, Flex, Heading, Link, Spinner, Table, Tabs, Text } from "@radix-ui/themes";
import { APP_NAME } from "nfx-ui/config";
import { ProfileKind, ProfileKindEnum } from "nfx-ui/enums";
import { useLoginWithEmail, useLoginWithPhone, useSelectProfile } from "nfx-ui/hooks";
import { LoginFormData, LoginWithPhoneFormData, useInitLoginForm, useInitLoginWithPhoneForm } from "nfx-ui/schemas";
import { FormProvider, SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Logo } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { LoginEmailController, LoginPasswordController, LoginPhoneController, LoginRememberController } from "@/features/account";
import { ROUTES } from "@/navigations";
import { AuthMotionRoot, AuthToolbar } from "@/pages/Account/shared/AuthChrome";
import { buildImageUrl, resolveAccountDisplayName, resolveAccountInitial, safeArray, safeOr, safeStringable } from "@/utils";

import styles from "./s.module.css";

export default function LoginPage() {
  const { t } = useTranslation("pages.Account.Login");
  const rack = useTranslation("pages.Account.AuthShell");
  const emailForm = useInitLoginForm();
  const phoneForm = useInitLoginWithPhoneForm();
  const loginEmail = useLoginWithEmail();
  const loginPhone = useLoginWithPhone();
  const selectProfile = useSelectProfile();
  const [profiles, setProfiles] = useState<Login.ProfileItem[]>([]);
  const [channel, setChannel] = useState<"email" | "phone">("email");

  const finishLogin = (result: Login.Response.LoginWithEmail) => {
    const list = safeArray(result?.profiles);
    if (list.length > 0) {
      setProfiles(list);
      return;
    }
    routerEventEmitter.navigate({ to: ROUTES.USER_OVERVIEW, replace: true });
  };

  const onEmail: SubmitHandler<LoginFormData> = async (data) => {
    const result = await loginEmail.mutateAsync({
      email: data.email,
      password: data.password,
      rememberMe: safeOr(data.rememberMe, false),
    });
    finishLogin(result);
  };

  const onPhone: SubmitHandler<LoginWithPhoneFormData> = async (data) => {
    const result = await loginPhone.mutateAsync({
      phone: data.phone,
      password: data.password,
      rememberMe: safeOr(data.rememberMe, false),
    });
    finishLogin(result);
  };

  const profileGroups = useMemo(() => {
    const community = profiles.filter((p) => ProfileKind(p.kind) === ProfileKindEnum.COMMUNITY);
    const authority = profiles.filter((p) => ProfileKind(p.kind) === ProfileKindEnum.AUTHORITY);
    return [
      { kind: ProfileKindEnum.COMMUNITY, items: community },
      { kind: ProfileKindEnum.AUTHORITY, items: authority },
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
      <Box asChild className={styles.rack}>
        <aside>
          <Box className={styles.rackPx}>
            <Box className={styles.rackPy}>
              <Flex direction="column" gap="6" justify="between" height="100%">
                <Flex direction="column" gap="2" className={styles.rackBrand} data-auth-motion>
                  <Logo variant="plain" size="small" to={ROUTES.LOGIN} title={rack.t("productName")} />
                  <Text as="span" className={styles.path}>
                    {rack.t("productPath")}
                  </Text>
                </Flex>
                <Flex direction="column" gap="2" className={styles.meter} data-auth-motion>
                  <Flex justify="between">
                    <Text size="1" color="gray">
                      {rack.t("capacityLabel")}
                    </Text>
                    <Text size="1" weight="bold">
                      {rack.t("capacityValue")}
                    </Text>
                  </Flex>
                  <Box className={styles.meterTrack} aria-hidden>
                    <Box className={styles.meterFill} />
                  </Box>
                  <Text size="1" color="gray">
                    {rack.t("capacityHint")}
                  </Text>
                </Flex>
                <Table.Root size="1" data-auth-motion>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>{rack.t("bucketCol")}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{rack.t("objectsCol")}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{rack.t("statusCol")}</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {bays.map((bay) => (
                      <Table.Row key={bay.name}>
                        <Table.Cell>{bay.name}</Table.Cell>
                        <Table.Cell>{bay.objects}</Table.Cell>
                        <Table.Cell className={bay.status === "online" ? styles.statusOn : styles.statusLock}>{rack.t(bay.status)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
                <Text size="2" color="gray" data-auth-motion>
                  {rack.t("summary")}
                </Text>
              </Flex>
            </Box>
          </Box>
        </aside>
      </Box>

      <Box asChild className={styles.session}>
        <section>
          <Box className={styles.sessionPx}>
            <Box className={styles.sessionPy}>
              <Flex direction="column" height="100%">
                <AuthToolbar />
                <Flex className={styles.sessionBody} align="center">
                  <Box className={styles.strip}>
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
                          const kind = ProfileKind(profile.kind);
                          const name = resolveAccountDisplayName(profile.displayName, profile.profileId);
                          const initial = resolveAccountInitial(profile.displayName, profile.profileId);
                          const roles = safeArray(profile.roles);
                          const place = [safeStringable(profile.city), safeStringable(profile.country)].filter(Boolean).join(", ");
                          return (
                            <Button
                              key={`${kind}:${profile.profileId}`}
                              type="button"
                              variant="ghost"
                              className={styles.profileRow}
                              disabled={selectProfile.isPending}
                              onClick={async () => {
                                await selectProfile.mutateAsync({
                                  profileId: profile.profileId,
                                  kind,
                                });
                                routerEventEmitter.navigate({ to: ROUTES.USER_OVERVIEW, replace: true });
                              }}
                            >
                              <Box className={styles.profileRowPy}>
                                <Box className={styles.profileRowGrid}>
                                  <Avatar size="2" radius="none" fallback={initial} src={profile.avatarImageId ? buildImageUrl(profile.avatarImageId) : undefined} />
                                  <Flex direction="column" className={styles.profileMeta} gap="1">
                                    <Flex align="center" gap="2" wrap="wrap">
                                      <Text size="2" weight="bold">
                                        {name}
                                      </Text>
                                      <Badge color={isAuthority ? "amber" : undefined} variant="outline" size="1">
                                        {kindLabel}
                                      </Badge>
                                    </Flex>
                                    <Text size="1" color="gray">
                                      {place || roles.map((role) => t(`selectProfile.roles.${role}`, { defaultValue: role })).join(" · ") || kindLabel}
                                    </Text>
                                  </Flex>
                                  {selectProfile.isPending ? <Spinner size="2" /> : <AnimatedIcon icon={RightChevron} size={16} />}
                                </Box>
                              </Box>
                            </Button>
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
                  <Tabs.Root value={channel} onValueChange={(value) => setChannel(value as "email" | "phone")}>
                    <Tabs.List>
                      <Tabs.Trigger value="email">{t("form.channelEmail")}</Tabs.Trigger>
                      <Tabs.Trigger value="phone">{t("form.channelPhone")}</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="email">
                      <FormProvider {...emailForm}>
                        <Flex asChild direction="column" gap="3" data-auth-motion>
                          <form noValidate onSubmit={emailForm.handleSubmit(onEmail)}>
                            <LoginEmailController />
                            <LoginPasswordController />
                            <LoginRememberController />
                            <Button type="submit" size="3" loading={loginEmail.isPending} radius="none" className={styles.fullWidth}>
                              {t("form.submit")}
                              <AnimatedIcon icon={ArrowNarrowRightIcon} size={16} />
                            </Button>
                          </form>
                        </Flex>
                      </FormProvider>
                    </Tabs.Content>
                    <Tabs.Content value="phone">
                      <FormProvider {...phoneForm}>
                        <Flex asChild direction="column" gap="3" data-auth-motion>
                          <form noValidate onSubmit={phoneForm.handleSubmit(onPhone)}>
                            <LoginPhoneController />
                            <LoginPasswordController />
                            <LoginRememberController />
                            <Button type="submit" size="3" loading={loginPhone.isPending} radius="none" className={styles.fullWidth}>
                              {t("form.submit")}
                              <AnimatedIcon icon={ArrowNarrowRightIcon} size={16} />
                            </Button>
                          </form>
                        </Flex>
                      </FormProvider>
                    </Tabs.Content>
                  </Tabs.Root>
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
                  </Box>
                </Flex>
              </Flex>
            </Box>
          </Box>
        </section>
      </Box>
    </AuthMotionRoot>
  );
}
