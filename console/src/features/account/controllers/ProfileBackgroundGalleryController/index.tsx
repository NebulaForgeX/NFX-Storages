import type { DragEndEvent } from "@dnd-kit/core";
import type { Profile } from "nfx-ui/types";
import type { CSSProperties } from "react";
import type { UserProfileBackgroundDraft } from "../../utils/userProfileBackgroundDrafts";

import { useRef } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ResetIcon } from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, IconButton, Spinner, Text } from "@radix-ui/themes";
import { ImagePlus, Images, Loader2, Save, Trash2, UploadCloud, XCircle } from "lucide-react";
import { useWheelHorizontalScroll } from "nfx-ui/hooks";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";

import { useUserProfileBackgroundUpload } from "../../hooks/useUserProfileBackgroundUpload";
import styles from "./styles.module.css";

export type ProfileBackgroundGalleryControllerProps = {
  profile: Profile.Response.ProfileBase;
};

type SortableBackgroundItemProps = {
  draft: UserProfileBackgroundDraft;
  onRemove: (imageId: string) => void;
  removeLabel: string;
};

const MAX_PROFILE_BACKGROUNDS = 6;

function isDraftBusy(draft: UserProfileBackgroundDraft) {
  return Boolean(draft.pending || draft.uploading || draft.status === "queued" || draft.status === "compressing" || draft.status === "preparing" || draft.status === "uploading");
}

const SortableBackgroundItem = ({ draft, onRemove, removeLabel }: SortableBackgroundItemProps) => {
  const { t } = useTranslation("pages.User.Profile.Edit");
  const isBusy = isDraftBusy(draft);
  const isFailed = draft.status === "failed";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: draft.imageId,
    disabled: isBusy || isFailed,
  });
  const progress = Math.max(0, Math.min(100, draft.progress ?? (isBusy ? 8 : 100)));
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      className={`${styles.tile} ${isDragging ? styles.tileDragging : ""} ${isBusy ? styles.tileBusy : ""} ${isFailed ? styles.tileFailed : ""}`}
      {...(isBusy || isFailed ? {} : attributes)}
      {...(isBusy || isFailed ? {} : listeners)}
    >
      <img src={draft.previewUrl} alt="" className={styles.tileImage} draggable={false} />
      <Flex asChild align="center" justify="center" className={styles.orderBadge}>
        <Text as="span" size="1" weight="bold">
          {draft.sortOrder + 1}
        </Text>
      </Flex>

      <IconButton
        type="button"
        variant="solid"
        color="red"
        size="2"
        className={styles.removeBtn}
        disabled={isBusy}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onRemove(draft.imageId)}
        aria-label={removeLabel}
        title={removeLabel}
      >
        <LucideIcon icon={Trash2} size={14} />
      </IconButton>

      {isBusy ? (
        <Flex
          align="center"
          justify="center"
          className={styles.progressRing}
          style={{ "--profile-background-upload-progress": `${progress}%` } as CSSProperties}
          aria-label={t("backgroundUpload.status.uploading")}
        >
          <Text as="span" size="1" weight="bold">
            {Math.round(progress)}
          </Text>
        </Flex>
      ) : null}

      {isFailed ? (
        <Text as="span" size="1" weight="bold" className={`${styles.statusPill} ${styles.statusFailed}`}>
          <LucideIcon icon={XCircle} size={12} />
          {t("backgroundUpload.status.failed")}
        </Text>
      ) : null}
    </Box>
  );
};

SortableBackgroundItem.displayName = "SortableBackgroundItem";

const ProfileBackgroundGalleryController = ({ profile }: ProfileBackgroundGalleryControllerProps) => {
  const { t } = useTranslation("pages.User.Profile.Edit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSurfaceRef = useWheelHorizontalScroll<HTMLDivElement>();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const { drafts, uploading, confirming, dirty, imageError, uploadFiles, removeDraft, reorderDrafts, confirmDrafts } = useUserProfileBackgroundUpload(
    profile,
    MAX_PROFILE_BACKGROUNDS,
  );

  const completedCount = drafts.filter((draft) => !draft.pending && !draft.uploading && draft.status !== "failed" && draft.status !== "queued").length;
  const activeDraft = drafts.find((draft) => draft.uploading || draft.status === "compressing" || draft.status === "preparing" || draft.status === "uploading");
  const queuedCount = drafts.filter((draft) => draft.pending || draft.status === "queued").length;
  const failedCount = drafts.filter((draft) => draft.status === "failed").length;
  const atLimit = completedCount + queuedCount >= MAX_PROFILE_BACKGROUNDS;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderDrafts(String(active.id), String(over.id));
  };

  return (
    <Card size="3" className={styles.root}>
      <Flex align="start" justify="between" gap="3" wrap="wrap" mb="4">
        <Flex direction="column" gap="1" minWidth="0">
          <Flex align="center" gap="1">
            <LucideIcon icon={Images} size={16} />
            <Text size="2" weight="medium">
              {t("backgroundUpload.label")}
            </Text>
          </Flex>
          <Text as="p" size="1" color="gray">
            {t("backgroundUpload.queueSummary", { done: completedCount, total: MAX_PROFILE_BACKGROUNDS })}
            {queuedCount > 0 ? ` · ${t("backgroundUpload.queuedCount", { count: queuedCount })}` : ""}
            {failedCount > 0 ? ` · ${t("backgroundUpload.failedCount", { count: failedCount })}` : ""}
          </Text>
        </Flex>

        <Flex align="center" gap="2" wrap="wrap">
          <Button type="button" variant="outline" size="2" disabled={uploading || confirming || atLimit} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <ResetIcon /> : <LucideIcon icon={ImagePlus} size={16} />}
            {atLimit ? t("backgroundUpload.full") : t("backgroundUpload.add")}
          </Button>
          <Button type="button" variant="soft" size="2" disabled={!dirty || uploading || confirming} onClick={confirmDrafts}>
            {confirming ? <Spinner /> : <LucideIcon icon={Save} size={16} />}
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
          if (files?.length) uploadFiles(files);
          event.target.value = "";
        }}
      />

      <Flex ref={uploadSurfaceRef} align="stretch" gap="3" className={styles.uploadSurface}>
        <Flex asChild align="center" justify="center" p="2" flexShrink="0" className={`${styles.addTile} ${atLimit ? styles.addTileDisabled : ""}`}>
          <button type="button" disabled={uploading || confirming || atLimit} onClick={() => fileInputRef.current?.click()}>
            <span className={styles.addContent}>
              <span className={styles.addIconWrap}>
                {uploading ? (
                  <LucideIcon icon={Loader2} size={24} className={styles.spin} />
                ) : drafts.length === 0 ? (
                  <LucideIcon icon={UploadCloud} size={24} />
                ) : (
                  <LucideIcon icon={ImagePlus} size={24} />
                )}
              </span>
              <Text as="span" size="2" className={styles.addTitle}>
                {activeDraft
                  ? t("backgroundUpload.activeUpload", { name: activeDraft.fileName || t("backgroundUpload.fallbackName", { index: activeDraft.sortOrder + 1 }) })
                  : atLimit
                    ? t("backgroundUpload.full")
                    : drafts.length === 0
                      ? t("backgroundUpload.dropTitle")
                      : t("backgroundUpload.add")}
              </Text>
            </span>
          </button>
        </Flex>

        {drafts.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={drafts.map((draft) => draft.imageId)} strategy={horizontalListSortingStrategy}>
              <Flex gap="3" className={styles.galleryRow}>
                {drafts.map((draft) => (
                  <SortableBackgroundItem key={draft.imageId} draft={draft} onRemove={removeDraft} removeLabel={t("backgroundUpload.remove")} />
                ))}
              </Flex>
            </SortableContext>
          </DndContext>
        ) : null}
      </Flex>

      {drafts.length > 1 ? (
        <Text as="p" size="1" color="gray" mt="2">
          {t("backgroundUpload.reorderHint")}
        </Text>
      ) : null}
      {imageError ? (
        <Text as="p" size="1" color="red" mt="1">
          {imageError}
        </Text>
      ) : null}
    </Card>
  );
};

ProfileBackgroundGalleryController.displayName = "ProfileBackgroundGalleryController";

export default ProfileBackgroundGalleryController;
