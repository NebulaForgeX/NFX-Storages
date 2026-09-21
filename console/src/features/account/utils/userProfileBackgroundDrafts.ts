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
  /** Waiting in the upload queue (placeholder visible, not started yet). */
  pending?: boolean;
  uploading?: boolean;
  /** Tmp asset row exists on server (prepare succeeded). */
  hasTmpAsset?: boolean;
  /** Already confirmed as part of the profile background gallery. */
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

function createDraftImageId(): string {
  const cryptoObj = globalThis.crypto;
  if (typeof cryptoObj?.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createUserProfileBackgroundPlaceholder(file: File, sortOrder: number): UserProfileBackgroundDraft {
  return {
    imageId: createDraftImageId(),
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
