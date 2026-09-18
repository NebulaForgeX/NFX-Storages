import type { Profile } from "nfx-ui/types";

import { useState } from "react";
import { Avatar, Badge, Box, Button, Card, Flex, Grid, Select, Text, TextField } from "@radix-ui/themes";
import { Users } from "lucide-react";
import { LanguageEnum, ProfileKindEnum } from "nfx-ui/enums";
import {
  useChangePassword,
  useCreateForgerProfile,
  useCreateEmail,
  useDeleteEmail,
  useDeleteProfile,
  useListEmails,
  useListProfiles,
  useSelectProfile,
  useSendChangePasswordVerificationCode,
  useSendEmailVerificationCode,
  useSetPrimaryEmail,
  useUpdateEmail,
  useVerifyEmail,
} from "nfx-ui/hooks";
import { useAuthStore, usePreferenceStore } from "nfx-ui/stores";
import { isVerificationCodeComplete, normalizeVerificationCode } from "nfx-ui/utils";
import { useTranslation } from "react-i18next";

import { PageHeader, Suspense } from "@/components";
import { PageFrame } from "@/layouts";
import { buildAvatarImageSrc, safeArray, safeStringable } from "@/utils";

type SectionId = "emails" | "password" | "profiles";

type IdentityRow = {
  profileId: string;
  displayName: Nullable<string>;
  kind: ProfileKindEnum;
  avatarImageId: Nullable<string>;
};

function toForgerRow(item: Profile.Response.ForgerProfileItem): IdentityRow {
  return {
    profileId: item.profileId,
    displayName: item.displayName,
    kind: ProfileKindEnum.FORGER,
    avatarImageId: item.avatarImageId,
  };
}

function toAuthorityRow(item: Profile.Response.AuthorityProfileItem): IdentityRow {
  return {
    profileId: item.profileId,
    displayName: item.displayName,
    kind: ProfileKindEnum.AUTHORITY,
    avatarImageId: item.avatarImageId,
  };
}

function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <Flex direction="column" align="center" justify="center" gap="1" py="6" px="4">
      <Text size="2" weight="medium">
        {title}
      </Text>
      <Text size="1" color="gray" align="center">
        {description}
      </Text>
    </Flex>
  );
}

function EmailRow({
  item,
}: {
  item: {
    id: string;
    email: string;
    isPrimary: boolean;
    verifiedAt: Nilable<string>;
  };
}) {
  const { t } = useTranslation("pages.User.Profile.Identities");
  const deleteEmail = useDeleteEmail();
  const setPrimary = useSetPrimaryEmail();
  const sendCode = useSendEmailVerificationCode();
  const verify = useVerifyEmail();
  const updateEmail = useUpdateEmail();
  const [code, setCode] = useState("");
  const [nextEmail, setNextEmail] = useState(item.email);
  const [editing, setEditing] = useState(false);
  const verified = Boolean(item.verifiedAt);
  const hint = [item.isPrimary ? t("labels.primary") : null, verified ? t("labels.verified") : t("labels.unverified")].filter(Boolean).join(" · ");

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Box>
          <Text size="2" weight="bold">
            {item.email}
          </Text>
          {hint ? (
            <Text size="1" color="gray" mt="1">
              {hint}
            </Text>
          ) : null}
        </Box>
        <Flex align="center" justify="between" gap="3" py="2">
          <Flex minWidth="0" flexGrow="1">
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                {t("labels.actions")}
              </Text>
              <Text size="2" color="gray">
                {item.id}
              </Text>
            </Flex>
          </Flex>
          <Flex gap="2" wrap="wrap" align="center">
            {!verified ? (
              <Button size="1" variant="soft" loading={sendCode.isPending} onClick={() => sendCode.mutate({ emailId: item.id })}>
                {t("actions.sendCode")}
              </Button>
            ) : null}
            {!item.isPrimary ? (
              <Button size="1" variant="soft" onClick={() => setPrimary.mutate(item.id)}>
                {t("actions.setPrimary")}
              </Button>
            ) : null}
            <Button size="1" variant="soft" onClick={() => setEditing((v) => !v)}>
              {editing ? t("actions.cancelEdit") : t("actions.editEmail")}
            </Button>
            <Button size="1" variant="soft" color="red" onClick={() => deleteEmail.mutate(item.id)}>
              {t("actions.remove")}
            </Button>
          </Flex>
        </Flex>

        {editing ? (
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              {t("labels.newEmail")}
            </Text>
            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Box minWidth="0" flexGrow="1">
                <TextField.Root size="2" value={nextEmail} onChange={(e) => setNextEmail(e.target.value)} />
              </Box>
              <Button
                size="1"
                loading={updateEmail.isPending}
                disabled={!nextEmail.trim() || nextEmail.trim() === item.email}
                onClick={() => updateEmail.mutate({ emailId: item.id, email: nextEmail.trim() }, { onSuccess: () => setEditing(false) })}
              >
                {t("actions.saveEmail")}
              </Button>
            </Flex>
          </Flex>
        ) : null}

        {!verified ? (
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              {t("labels.verificationCode")}
            </Text>
            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Box minWidth="0" flexGrow="1">
                <TextField.Root size="2" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("labels.verificationCode")} />
              </Box>
              <Button
                size="1"
                loading={verify.isPending}
                disabled={!code.trim()}
                onClick={() => verify.mutate({ emailId: item.id, verificationCode: code.trim() }, { onSuccess: () => setCode("") })}
              >
                {t("actions.verify")}
              </Button>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
    </Card>
  );
}

function EmailsSection() {
  const { t } = useTranslation("pages.User.Profile.Identities");
  const emails = useListEmails();
  const createEmail = useCreateEmail();
  const [newEmail, setNewEmail] = useState("");
  const emailItems = safeArray(emails.data?.items);

  return (
    <Flex direction="column" gap="3">
      <Card size="2">
        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" weight="bold">
              {t("sections.emails.title")}
            </Text>
            <Text size="1" color="gray" mt="1">
              {t("sections.emails.description")}
            </Text>
          </Box>
          {emailItems.length ? null : <EmptyBlock title={t("empty.emails.title")} description={t("empty.emails.description")} />}
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              {t("labels.emailPlaceholder")}
            </Text>
            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Box minWidth="0" flexGrow="1">
                <TextField.Root size="2" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={t("labels.emailPlaceholder")} />
              </Box>
              <Button size="2" onClick={() => createEmail.mutate({ email: newEmail }, { onSuccess: () => setNewEmail("") })}>
                {t("actions.addEmail")}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
      {emailItems.map((item) => (
        <EmailRow key={item.id} item={item} />
      ))}
    </Flex>
  );
}

function PasswordSection() {
  const { t } = useTranslation("pages.User.Profile.Identities");
  const currentLanguage = usePreferenceStore((s) => s.language);
  const changePassword = useChangePassword();
  const sendCode = useSendChangePasswordVerificationCode();
  const emails = useListEmails();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const primaryEmail = safeArray(emails.data?.items).find((e) => e.isPrimary)?.email;
  const busy = changePassword.isPending || sendCode.isPending;
  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && isVerificationCodeComplete(verificationCode) && !busy;

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Box>
          <Text size="2" weight="bold">
            {t("sections.password.title")}
          </Text>
          <Text size="1" color="gray" mt="1">
            {t("sections.password.description")}
          </Text>
        </Box>
        <Flex direction="column" gap="2">
          <Text size="1" weight="medium" color="gray">
            {t("labels.currentPassword")}
          </Text>
          <TextField.Root
            size="2"
            type="password"
            value={currentPassword}
            disabled={busy}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("labels.currentPassword")}
          />
        </Flex>
        <Flex direction="column" gap="2">
          <Text size="1" weight="medium" color="gray">
            {t("labels.newPassword")}
          </Text>
          <TextField.Root size="2" type="password" value={newPassword} disabled={busy} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("labels.newPassword")} />
        </Flex>
        <Flex direction="column" gap="2">
          <Text size="1" weight="medium" color="gray">
            {t("labels.verificationCode")}
          </Text>
          <Text size="1" color="gray">
            {primaryEmail ? t("labels.passwordSendCodeHint", { email: primaryEmail }) : t("labels.passwordSendCodeHintNoEmail")}
          </Text>
          <Flex gap="2" align="center">
            <Box minWidth="0" flexGrow="1">
              <TextField.Root
                size="2"
                autoComplete="one-time-code"
                value={verificationCode}
                disabled={busy}
                onChange={(e) => setVerificationCode(normalizeVerificationCode(e.target.value))}
                placeholder={t("labels.verificationCodePlaceholder")}
              />
            </Box>
            <Button
              type="button"
              size="2"
              variant="soft"
              loading={sendCode.isPending}
              disabled={busy || !primaryEmail}
              onClick={() =>
                void sendCode.mutateAsync({
                  lang: currentLanguage ?? LanguageEnum.EN,
                })
              }
            >
              {t("actions.sendCode")}
            </Button>
          </Flex>
        </Flex>
        <Flex align="center" justify="end" gap="3" py="2">
          <Button
            size="2"
            loading={changePassword.isPending}
            disabled={!canSubmit}
            onClick={() =>
              changePassword
                .mutateAsync({
                  currentPassword,
                  newPassword,
                  verificationCode: normalizeVerificationCode(verificationCode),
                })
                .then(() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setVerificationCode("");
                })
            }
          >
            {t("actions.updatePassword")}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

function ProfilesSection() {
  const { t } = useTranslation("pages.User.Profile.Identities");
  const currentProfileId = useAuthStore((s) => s.currentProfileId);
  const currentProfileKind = useAuthStore((s) => s.currentProfileKind);
  const forgerProfiles = useListProfiles(ProfileKindEnum.FORGER);
  const authorityProfiles = useListProfiles(ProfileKindEnum.AUTHORITY);
  const createProfile = useCreateForgerProfile();
  const deleteProfile = useDeleteProfile();
  const selectProfile = useSelectProfile();
  const [displayName, setDisplayName] = useState("");
  const [profileLanguage, setProfileLanguage] = useState<LanguageEnum>(LanguageEnum.EN);
  const [switchingId, setSwitchingId] = useState<Nullable<string>>(null);

  const forger = safeArray(forgerProfiles.data?.items);
  const authority = safeArray(authorityProfiles.data?.items);
  const rows: IdentityRow[] = [...forger.map(toForgerRow), ...authority.map(toAuthorityRow)];
  const total = rows.length;
  const atFloor = total <= 1;

  const handleSwitch = async (profileId: string, kind: ProfileKindEnum) => {
    if ((profileId === currentProfileId && kind === currentProfileKind) || selectProfile.isPending) return;
    setSwitchingId(profileId);
    try {
      await selectProfile.mutateAsync({ profileId, kind });
    } finally {
      setSwitchingId(null);
    }
  };

  const handleDelete = (profileId: string, kind: ProfileKindEnum, name: string) => {
    if (!window.confirm(t("labels.deleteConfirmBody", { name }))) return;
    deleteProfile.mutate({ profileId, kind });
  };

  return (
    <Flex direction="column" gap="3">
      <Card size="2">
        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" weight="bold">
              {t("sections.profiles.title")}
            </Text>
            <Text size="1" color="gray" mt="1">
              {t("sections.profiles.description")}
            </Text>
          </Box>
          {rows.length ? (
            rows.map((row) => {
              const isCommunity = row.kind === ProfileKindEnum.FORGER;
              const isCurrent = row.profileId === currentProfileId && row.kind === currentProfileKind;
              const name = safeStringable(row.displayName) || t("labels.emptyName");
              const isSwitching = switchingId === row.profileId;
              const busy = isSwitching || deleteProfile.isPending || selectProfile.isPending;
              const initials = name.slice(0, 2).toUpperCase();

              return (
                <Flex key={`${row.kind}-${row.profileId}`} align="center" justify="between" gap="3" py="2">
                  <Flex align="center" gap="3" minWidth="0" flexGrow="1">
                    <Avatar size="2" src={row.avatarImageId ? buildAvatarImageSrc(row.avatarImageId) : undefined} fallback={initials} />
                    <Flex direction="column" gap="1" minWidth="0">
                      <Text size="2" weight="medium">
                        {name}
                      </Text>
                      <Flex gap="2" align="center" wrap="wrap">
                        <Badge color={isCommunity ? "blue" : "amber"} variant="soft">
                          {isCommunity ? t("labels.scopeCommunity") : t("labels.scopeAuthority")}
                        </Badge>
                        <Text size="1" color="gray">
                          {row.profileId}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                  <Flex gap="2" wrap="wrap" align="center">
                    {isCurrent ? (
                      <Badge color="green" variant="soft">
                        {t("labels.current")}
                      </Badge>
                    ) : (
                      <Button size="1" variant="soft" disabled={busy} loading={isSwitching} onClick={() => void handleSwitch(row.profileId, row.kind)}>
                        {t("actions.switch")}
                      </Button>
                    )}
                    {isCommunity ? (
                      <Button
                        size="1"
                        variant="soft"
                        color="red"
                        disabled={isCurrent || atFloor || busy}
                        title={isCurrent ? t("labels.cannotDeleteCurrent") : atFloor ? t("labels.cannotDeleteLast") : undefined}
                        loading={deleteProfile.isPending}
                        onClick={() => handleDelete(row.profileId, row.kind, name)}
                      >
                        {t("actions.deleteProfile")}
                      </Button>
                    ) : null}
                  </Flex>
                </Flex>
              );
            })
          ) : (
            <EmptyBlock title={t("empty.profiles.title")} description={t("empty.profiles.description")} />
          )}
        </Flex>
      </Card>

      <Card size="2">
        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" weight="bold">
              {t("labels.newCommunityProfile")}
            </Text>
            <Text size="1" color="gray" mt="1">
              {t("sections.forgerProfiles.description")}
            </Text>
          </Box>
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              {t("labels.displayName")}
            </Text>
            <TextField.Root size="2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("labels.displayName")} />
          </Flex>
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              {t("labels.profileLanguage")}
            </Text>
            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Box minWidth="0" flexGrow="1">
                <Select.Root value={profileLanguage} onValueChange={(v) => setProfileLanguage(v as LanguageEnum)}>
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value={LanguageEnum.EN}>{t("labels.langEn")}</Select.Item>
                    <Select.Item value={LanguageEnum.ZH}>{t("labels.langZh")}</Select.Item>
                    <Select.Item value={LanguageEnum.FR}>{t("labels.langFr")}</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>
              <Button
                size="2"
                loading={createProfile.isPending}
                disabled={!displayName.trim()}
                onClick={() => createProfile.mutate({ displayName: displayName.trim(), profileLanguage }, { onSuccess: () => setDisplayName("") })}
              >
                {t("actions.createProfile")}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}

function IdentitiesBody() {
  const { t } = useTranslation("pages.User.Profile.Identities");
  const [section, setSection] = useState<SectionId>("profiles");
  const sections: { id: SectionId; label: string }[] = [
    { id: "profiles", label: t("sections.profiles.title") },
    { id: "emails", label: t("sections.emails.title") },
    { id: "password", label: t("sections.password.title") },
  ];

  return (
    <Grid columns={{ initial: "1", md: "12rem 1fr" }} gap="5" align="start">
      <Flex direction={{ initial: "row", md: "column" }} gap="1" wrap="wrap">
        {sections.map((s) => {
          const active = section === s.id;
          return (
            <Button key={s.id} variant={active ? "soft" : "outline"} color={active ? undefined : "gray"} onClick={() => setSection(s.id)}>
              {s.label}
            </Button>
          );
        })}
      </Flex>
      <Flex direction="column" gap="3" minWidth="0">
        {section === "profiles" ? <ProfilesSection /> : null}
        {section === "emails" ? <EmailsSection /> : null}
        {section === "password" ? <PasswordSection /> : null}
      </Flex>
    </Grid>
  );
}

export default function ProfileIdentitiesPage() {
  const { t } = useTranslation("pages.User.Profile.Identities");
  return (
    <PageFrame>
      <PageHeader icon={Users} title={t("title")} description={t("description")} />
      <Suspense loadingText={t("labels.loading")}>
        <IdentitiesBody />
      </Suspense>
    </PageFrame>
  );
}
