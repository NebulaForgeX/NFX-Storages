import { ArrowNarrowLeftIcon, RightChevron, CameraIcon, SaveIcon, TrashIcon } from "nfx-ui/icons";
import type { Profile } from "nfx-ui/types";

import { useRef } from "react";
import { Box, Button, Card, Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";

import { isUserProfileBackgroundDraftBusy } from "./drafts";
import styles from "./s.module.css";
import { useUserProfileBackgroundUpload } from "./useUserProfileBackgroundUpload";

const MAX_PROFILE_BACKGROUNDS = 6;

export default function BackgroundGallery({ profile }: { profile: Profile.Response.ProfileBase }) {
  const { t } = useTranslation("pages.User.Profile.Edit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { drafts, uploading, confirming, dirty, imageError, uploadFiles, removeDraft, moveDraft, confirmDrafts } = useUserProfileBackgroundUpload(profile, MAX_PROFILE_BACKGROUNDS);

  const completedCount = drafts.filter((d) => !isUserProfileBackgroundDraftBusy(d) && d.status !== "failed").length;
  const atLimit = drafts.filter((d) => d.status !== "failed").length >= MAX_PROFILE_BACKGROUNDS;

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Box>
          <Text size="2" weight="bold">
            {t("backgroundUpload.label")}
          </Text>
          <Text size="1" color="gray" mt="1">
            {t("backgroundUpload.hint")}
          </Text>
        </Box>
        <Flex align="center" justify="between" gap="3" py="2">
          <Flex minWidth="0" flexGrow="1">
            <Text size="1" color="gray">
              {t("backgroundUpload.queueSummary", {
                done: completedCount,
                total: MAX_PROFILE_BACKGROUNDS,
              })}
            </Text>
          </Flex>
          <Flex gap="2" wrap="wrap" align="center">
            <Button type="button" size="2" variant="soft" disabled={uploading || confirming || atLimit} onClick={() => fileInputRef.current?.click()}>
              <LucideIcon icon={CameraIcon} size={14} />
              {atLimit ? t("backgroundUpload.full") : t("backgroundUpload.add")}
            </Button>
            <Button type="button" size="2" disabled={!dirty || uploading || confirming} loading={confirming} onClick={() => void confirmDrafts()}>
              <LucideIcon icon={SaveIcon} size={14} />
              {confirming ? t("backgroundUpload.confirming") : t("backgroundUpload.confirm")}
            </Button>
          </Flex>
        </Flex>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenInput}
          onChange={(event) => {
            const files = event.target.files;
            if (files?.length) void uploadFiles(files);
            event.target.value = "";
          }}
        />

        {drafts.length ? (
          <Flex wrap="wrap" gap="3" width="100%">
            {drafts.map((draft, index) => {
              const busy = isUserProfileBackgroundDraftBusy(draft);
              const failed = draft.status === "failed";
              return (
                <Box key={draft.imageId} position="relative" className={styles.tile}>
                  <img src={draft.previewUrl} alt="" className={styles.tileImage} draggable={false} />
                  <Box className={styles.orderBadge}>
                    <Text size="1" weight="bold">
                      {draft.sortOrder + 1}
                    </Text>
                  </Box>
                  {busy ? (
                    <Flex position="absolute" inset="0" align="center" justify="center" className={styles.busyOverlay}>
                      <Text size="1" weight="bold">
                        {Math.round(draft.progress ?? 0)}%
                      </Text>
                    </Flex>
                  ) : null}
                  {failed ? (
                    <Flex position="absolute" inset="0" align="center" justify="center" className={styles.failedOverlay}>
                      <Text size="1" weight="bold">
                        {t("backgroundUpload.status.failed")}
                      </Text>
                    </Flex>
                  ) : null}
                  <Flex position="absolute" right="1" bottom="1" gap="1" className={styles.tileActions}>
                    <Button
                      type="button"
                      size="1"
                      variant="soft"
                      color="gray"
                      disabled={busy || failed || index === 0}
                      onClick={() => moveDraft(draft.imageId, -1)}
                      aria-label={t("backgroundUpload.moveLeft")}
                    >
                      <LucideIcon icon={ArrowNarrowLeftIcon} size={12} />
                    </Button>
                    <Button
                      type="button"
                      size="1"
                      variant="soft"
                      color="gray"
                      disabled={busy || failed || index === drafts.length - 1}
                      onClick={() => moveDraft(draft.imageId, 1)}
                      aria-label={t("backgroundUpload.moveRight")}
                    >
                      <LucideIcon icon={RightChevron} size={12} />
                    </Button>
                    <Button type="button" size="1" variant="soft" color="red" disabled={busy} onClick={() => removeDraft(draft.imageId)} aria-label={t("backgroundUpload.remove")}>
                      <LucideIcon icon={TrashIcon} size={12} />
                    </Button>
                  </Flex>
                </Box>
              );
            })}
          </Flex>
        ) : (
          <Text size="2" color="gray">
            {t("backgroundUpload.dropTitle")}
          </Text>
        )}

        {drafts.length > 1 ? (
          <Text size="1" color="gray" mt="2">
            {t("backgroundUpload.reorderHint")}
          </Text>
        ) : null}
        {imageError ? (
          <Text size="1" color="red" mt="1">
            {imageError}
          </Text>
        ) : null}
      </Flex>
    </Card>
  );
}
