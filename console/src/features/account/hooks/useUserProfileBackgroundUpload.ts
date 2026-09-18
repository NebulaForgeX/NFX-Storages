import type { TFunction } from "i18next";
import type { Profile } from "nfx-ui/types";
import type { UserProfileBackgroundDraft, UserProfileBackgroundUploadStatus } from "../utils/userProfileBackgroundDrafts";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { AssetCategoryEnum, AssetTypeEnum } from "nfx-ui/enums";
import { systemEventEmitter } from "nfx-ui/events";
import { useConfirmProfileBackgrounds, useDeleteImage, usePrepareImageUpload } from "nfx-ui/hooks";
import { createUserProfileBackgroundsFieldSchema } from "nfx-ui/schemas";
import { buildImageUrl, getApiPulsoLinkErrorMessage, safeArray } from "nfx-ui/utils";
import { useTranslation } from "react-i18next";

import {
  applyUserProfileBackgroundSortOrders,
  createUserProfileBackgroundPlaceholder,
  draftsToUserProfileBackgroundItems,
  isUserProfileBackgroundDraftBusy,
  normalizeUserProfileBackgroundSortOrders,
  revokeUserProfileBackgroundPreviewUrl,
} from "../utils/userProfileBackgroundDrafts";

export type { UserProfileBackgroundDraft };

type UploadTask = {
  draft: UserProfileBackgroundDraft;
  file: File;
};

function isUploadActive(status: Maybe<UserProfileBackgroundUploadStatus>) {
  return status === "queued" || status === "compressing" || status === "preparing" || status === "uploading";
}

function getServerBackgroundDrafts(profile: Profile.Response.ProfileBase): UserProfileBackgroundDraft[] {
  return safeArray(profile.backgrounds)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.imageId.localeCompare(b.imageId))
    .map((item, index) => ({
      imageId: item.imageId,
      previewUrl: buildImageUrl(item.imageId),
      sortOrder: index,
      fileName: `Background ${index + 1}`,
      progress: 100,
      status: "complete",
      pending: false,
      uploading: false,
      hasTmpAsset: false,
      committed: true,
    }));
}

export function useUserProfileBackgroundUpload(profile: Profile.Response.ProfileBase, maxImages: number) {
  const { t } = useTranslation("pages.User.Profile.Edit");
  const backgroundsSchema = createUserProfileBackgroundsFieldSchema(t as TFunction<"pages.User.Profile.Edit">, maxImages);
  const prepareUpload = usePrepareImageUpload();
  const confirmBackgrounds = useConfirmProfileBackgrounds();
  const deleteImage = useDeleteImage({ ifShowError: false });
  const [drafts, setDraftsState] = useState<UserProfileBackgroundDraft[]>(() => getServerBackgroundDrafts(profile));
  const draftsRef = useRef<UserProfileBackgroundDraft[]>(drafts);
  const deleteImageRef = useRef(deleteImage.mutate);
  const [imageError, setImageError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const profileBackgroundSignature = safeArray(profile.backgrounds)
    .map((item) => `${item.imageId}:${item.sortOrder}`)
    .sort()
    .join("|");

  const serverDrafts = useMemo(() => getServerBackgroundDrafts(profile), [profileBackgroundSignature]);

  const setDrafts = useCallback((next: UserProfileBackgroundDraft[] | ((current: UserProfileBackgroundDraft[]) => UserProfileBackgroundDraft[])) => {
    const resolved = typeof next === "function" ? next(draftsRef.current) : next;
    draftsRef.current = resolved;
    setDraftsState(resolved);
    return resolved;
  }, []);

  useEffect(() => {
    deleteImageRef.current = deleteImage.mutate;
  }, [deleteImage.mutate]);

  useEffect(() => {
    const serverIds = new Set(serverDrafts.map((item) => item.imageId));
    let hasLocalDrafts = false;
    setDrafts((current) => {
      const localDrafts = current.filter((item) => !item.committed && !serverIds.has(item.imageId));
      hasLocalDrafts = localDrafts.length > 0;
      return normalizeUserProfileBackgroundSortOrders([...serverDrafts, ...localDrafts]);
    });
    if (!hasLocalDrafts) setDirty(false);
  }, [serverDrafts, setDrafts]);

  useEffect(() => {
    return () => {
      for (const draft of draftsRef.current) {
        revokeUserProfileBackgroundPreviewUrl(draft.previewUrl);
        if (!draft.committed && draft.hasTmpAsset) {
          deleteImageRef.current(draft.imageId);
        }
      }
    };
  }, []);

  const uploading = busy || drafts.some(isUserProfileBackgroundDraftBusy);

  const patchDraft = (localId: string, serverId: string, patch: Partial<UserProfileBackgroundDraft>) => {
    setDrafts((current) => current.map((item) => (item.imageId === localId || item.imageId === serverId ? { ...item, ...patch } : item)));
  };

  const uploadOne = async ({ draft, file }: UploadTask) => {
    const localId = draft.imageId;
    let serverId = localId;

    patchDraft(localId, serverId, {
      pending: false,
      uploading: true,
      status: "preparing",
      progress: 20,
      error: undefined,
    });

    try {
      const slot = await prepareUpload.mutateAsync({
        assetType: AssetTypeEnum.IMAGE,
        assetCategory: AssetCategoryEnum.BACKGROUND,
        fileName: file.name,
        mimeType: file.type || "image/png",
      });
      serverId = slot.imageId;

      setDrafts((current) =>
        normalizeUserProfileBackgroundSortOrders(
          current.map((item) =>
            item.imageId === localId
              ? {
                  ...item,
                  imageId: slot.imageId,
                  hasTmpAsset: true,
                  committed: false,
                  uploading: true,
                  status: "uploading",
                  progress: 50,
                }
              : item,
          ),
        ),
      );

      const response = await fetch(slot.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/png" },
      });
      if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.status}`);
      }

      patchDraft(localId, serverId, {
        pending: false,
        uploading: false,
        status: "complete",
        progress: 100,
        error: undefined,
      });
      setDirty(true);
    } catch (error) {
      const message = getApiPulsoLinkErrorMessage(error, t("backgroundUpload.uploadFailed"));
      patchDraft(localId, serverId, {
        pending: false,
        uploading: false,
        status: "failed",
        progress: 100,
        error: message,
      });
      if (serverId !== localId) {
        deleteImage.mutate(serverId);
      }
      setImageError(message);
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (busy || confirmBackgrounds.isPending) return;

    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      setImageError(t("backgroundUpload.invalidType"));
      return;
    }

    setImageError(undefined);

    const current = draftsRef.current;
    const occupied = current.filter((item) => item.status !== "failed").length;
    const room = maxImages - occupied;
    const accepted = room > 0 ? images.slice(0, room) : [];
    const limitReached = images.length > Math.max(room, 0);
    const startOrder = current.length;
    const tasks = accepted.map((file, index) => {
      const draft = createUserProfileBackgroundPlaceholder(file, startOrder + index);
      return { draft, file };
    });

    if (tasks.length > 0) {
      setDrafts(normalizeUserProfileBackgroundSortOrders([...current, ...tasks.map(({ draft }) => draft)]));
    }

    if (tasks.length === 0) {
      if (limitReached) {
        setImageError(t("backgroundUpload.limitReached", { max: maxImages }));
      }
      return;
    }

    if (limitReached) {
      setImageError(t("backgroundUpload.limitReached", { max: maxImages }));
    }

    setBusy(true);
    try {
      for (const task of tasks) {
        await uploadOne(task);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeDraft = (imageId: string) => {
    setDrafts((prev) => {
      const target = prev.find((item) => item.imageId === imageId);
      if (!target) return prev;

      revokeUserProfileBackgroundPreviewUrl(target.previewUrl);
      if (!target.committed && target.hasTmpAsset) {
        deleteImage.mutate(imageId);
      }

      return normalizeUserProfileBackgroundSortOrders(prev.filter((item) => item.imageId !== imageId));
    });
    setDirty(true);
    setImageError(undefined);
  };

  const reorderDrafts = (activeId: string, overId: string) => {
    setDrafts((prev) => {
      const active = prev.find((item) => item.imageId === activeId);
      const over = prev.find((item) => item.imageId === overId);
      if (!active || !over) return prev;
      if (isUploadActive(active.status) || isUploadActive(over.status) || active.pending || over.pending) return prev;
      if (active.status === "failed" || over.status === "failed") return prev;

      const oldIndex = prev.findIndex((item) => item.imageId === activeId);
      const newIndex = prev.findIndex((item) => item.imageId === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;

      setDirty(true);
      return applyUserProfileBackgroundSortOrders(arrayMove(prev, oldIndex, newIndex));
    });
  };

  const confirmDrafts = async () => {
    if (uploading) {
      setImageError(t("backgroundUpload.waitForUploads"));
      return;
    }

    const images = draftsToUserProfileBackgroundItems(draftsRef.current).slice(0, maxImages);
    const parsed = backgroundsSchema.safeParse(images);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || t("backgroundUpload.saveFailed");
      setImageError(message);
      systemEventEmitter.showError(message);
      return;
    }

    await confirmBackgrounds.mutateAsync({ images: parsed.data });
    setDrafts((current) =>
      normalizeUserProfileBackgroundSortOrders(
        current.map((item) => ({
          ...item,
          committed: item.status !== "failed",
          hasTmpAsset: false,
        })),
      ),
    );
    setDirty(false);
    setImageError(undefined);
  };

  return {
    drafts,
    uploading,
    confirming: confirmBackgrounds.isPending,
    dirty,
    imageError,
    uploadFiles,
    removeDraft,
    reorderDrafts,
    confirmDrafts,
  };
}
