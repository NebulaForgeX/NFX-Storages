import { useRef, useState } from "react";
import { Avatar, Box, Button, Card, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { Pencil, Upload } from "lucide-react";
import { systemEventEmitter } from "nfx-ui/events";
import { useConfirmImageUpload, useConfirmProfileAvatar, useCurrentProfile, useDeleteImage, usePatchProfile, usePrepareImageUpload } from "nfx-ui/hooks";
import { useTranslation } from "react-i18next";

import { LucideIcon, PageHeader } from "@/components";
import { PageFrame } from "@/layouts";
import { buildImageUrl, buildProfilePatch, compressImage, getApiErrorMessage, isEmptyPatch, resolveAccountInitial, safeNullable, safeStringable } from "@/utils";

import BackgroundGallery from "./backgrounds/BackgroundGallery";

function AvatarSection() {
  const { t } = useTranslation("pages.User.Profile.Edit");
  const { profile, data } = useCurrentProfile();
  const prepareUpload = usePrepareImageUpload();
  const confirmUpload = useConfirmImageUpload();
  const confirmAvatar = useConfirmProfileAvatar();
  const deleteImage = useDeleteImage({ ifShowError: false });
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<Nullable<string>>(null);
  const [pendingImageId, setPendingImageId] = useState<Nullable<string>>(null);

  const accountId = safeNullable(data?.account.id);
  const initial = resolveAccountInitial(profile?.displayName, accountId);
  const currentAvatarId = safeNullable(profile?.avatars?.[0]?.imageId);
  const busy = prepareUpload.isPending || confirmUpload.isPending;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      systemEventEmitter.showError(t("avatar.invalidType"));
      return;
    }
    if (pendingImageId) deleteImage.mutate(pendingImageId);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPendingImageId(null);
    try {
      const compressed = await compressImage(file);
      const prep = await prepareUpload.mutateAsync({
        fileName: compressed.name,
        mimeType: compressed.type || "image/png",
      });
      const putRes = await fetch(prep.uploadUrl, {
        method: "PUT",
        body: compressed,
        headers: { "Content-Type": compressed.type || "image/png" },
      });
      if (!putRes.ok) throw new Error(`upload ${putRes.status}`);
      setPendingImageId(prep.id);
    } catch (err) {
      systemEventEmitter.showError(getApiErrorMessage(err, t("avatar.uploadFailed")));
      setPendingImageId(null);
    }
  };

  const handleConfirm = async () => {
    if (!pendingImageId) {
      systemEventEmitter.showError(t("avatar.noImage"));
      return;
    }
    try {
      await confirmUpload.mutateAsync({ id: pendingImageId });
      await confirmAvatar.mutateAsync({ imageId: pendingImageId });
      systemEventEmitter.showSuccess(t("avatar.success"));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPendingImageId(null);
    } catch (err) {
      systemEventEmitter.showError(getApiErrorMessage(err, t("avatar.confirmFailed")));
    }
  };

  const src = previewUrl || (currentAvatarId ? buildImageUrl(currentAvatarId) : undefined);

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Box>
          <Text size="2" weight="bold">
            {t("avatar.title")}
          </Text>
          <Text size="1" color="gray" mt="1">
            {t("avatar.hint")}
          </Text>
        </Box>
        <Flex align="center" justify="between" gap="3" py="2">
          <Flex align="center" gap="3" minWidth="0" flexGrow="1">
            <Avatar size="5" radius="full" src={src} fallback={initial} />
            <Text size="2" color="gray">
              {t("avatar.pickHint")}
            </Text>
          </Flex>
          <Flex gap="2" wrap="wrap" align="center">
            <Button size="2" variant="soft" disabled={busy} onClick={() => fileRef.current?.click()}>
              <LucideIcon icon={Upload} size={14} />
              {busy ? t("avatar.uploading") : t("avatar.choose")}
            </Button>
            <Button size="2" disabled={!pendingImageId || busy} onClick={() => void handleConfirm()}>
              {confirmUpload.isPending ? t("avatar.confirming") : t("avatar.confirm")}
            </Button>
          </Flex>
        </Flex>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </Flex>
    </Card>
  );
}

export default function ProfileEditPage() {
  const { t } = useTranslation("pages.User.Profile.Edit");
  const { profile } = useCurrentProfile();
  const patch = usePatchProfile();
  const [displayName, setDisplayName] = useState(safeStringable(profile?.displayName));
  const [bio, setBio] = useState(safeStringable(profile?.bio));
  const [city, setCity] = useState(safeStringable(profile?.city));
  const [website, setWebsite] = useState(safeStringable(profile?.website));

  return (
    <PageFrame>
      <PageHeader icon={Pencil} title={t("title")} description={t("description")} />
      <Flex direction="column" gap="3">
        <AvatarSection />
        {profile ? <BackgroundGallery profile={profile} /> : null}
        <Card size="2">
          <Flex direction="column" gap="3">
            <Box>
              <Text size="2" weight="bold">
                {t("sections.basics.title")}
              </Text>
              <Text size="1" color="gray" mt="1">
                {t("sections.basics.description")}
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
                {t("labels.bio")}
              </Text>
              <TextArea size="2" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("labels.bio")} rows={4} />
            </Flex>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                {t("labels.city")}
              </Text>
              <TextField.Root size="2" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("labels.city")} />
            </Flex>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                {t("labels.website")}
              </Text>
              <TextField.Root size="2" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={t("labels.website")} />
            </Flex>
            <Flex align="center" justify="end" gap="3" py="2">
              <Button
                size="2"
                loading={patch.isPending}
                disabled={!profile}
                onClick={() => {
                  if (!profile) return;
                  const body = buildProfilePatch(profile, {
                    displayName,
                    bio,
                    city,
                    website,
                  });
                  if (isEmptyPatch(body)) return;
                  patch.mutate(body);
                }}
              >
                {t("actions.saveChanges")}
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </PageFrame>
  );
}
