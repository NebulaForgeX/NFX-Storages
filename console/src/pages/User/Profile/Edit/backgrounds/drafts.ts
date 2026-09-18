export type UserProfileBackgroundUploadStatus = "queued" | "compressing" | "preparing" | "uploading" | "complete" | "failed";

export type UserProfileBackgroundDraft = {
  imageId: string;
  previewUrl: string;
  sortOrder: number;
  fileName?: string;
  fileSize?: number;
  progress?: number;
  status?: UserProfileBackgroundUploadStatus;
  error?: string;
  pending?: boolean;
  uploading?: boolean;
  hasTmpAsset?: boolean;
  committed?: boolean;
};

export function normalizeUserProfileBackgroundSortOrders<D extends UserProfileBackgroundDraft>(drafts: D[]): D[] {
  return drafts
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.imageId.localeCompare(b.imageId))
    .map((item, index) => ({ ...item, sortOrder: index }));
}

export function applyUserProfileBackgroundSortOrders<D extends UserProfileBackgroundDraft>(drafts: D[]): D[] {
  return drafts.map((item, index) => ({ ...item, sortOrder: index }));
}

export function createUserProfileBackgroundPlaceholder(file: File, sortOrder: number): UserProfileBackgroundDraft {
  return {
    imageId: crypto.randomUUID(),
    previewUrl: URL.createObjectURL(file),
    sortOrder,
    fileName: file.name,
    fileSize: file.size,
    progress: 0,
    status: "queued",
    pending: true,
    committed: false,
  };
}

export function isUserProfileBackgroundDraftBusy(draft: UserProfileBackgroundDraft): boolean {
  return Boolean(draft.pending || draft.uploading || draft.status === "queued" || draft.status === "compressing" || draft.status === "preparing" || draft.status === "uploading");
}

function isUserProfileBackgroundDraftComplete(draft: UserProfileBackgroundDraft): boolean {
  return !isUserProfileBackgroundDraftBusy(draft) && draft.status !== "failed";
}

export function draftsToUserProfileBackgroundItems(drafts: UserProfileBackgroundDraft[]): Array<Pick<UserProfileBackgroundDraft, "imageId" | "sortOrder">> {
  return drafts.filter((item) => isUserProfileBackgroundDraftComplete(item)).map((item) => ({ imageId: item.imageId, sortOrder: item.sortOrder }));
}

export function revokeUserProfileBackgroundPreviewUrl(previewUrl: string) {
  if (previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
}
