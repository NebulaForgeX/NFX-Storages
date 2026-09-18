import type { DataResponse } from "nfx-ui/types"
import type { Asset } from "@/identity/types";

import { protectedClient, publicClientWithoutTransform } from "../clients";
import { API_ENDPOINTS, dataFromResponse, URL_PATHS } from "../ip";

type Kind = Asset.Kind;

export interface AssetRepository {
  GetErrorTranslations(lang: string): Promise<Record<string, string>>;
  List(kind: Kind): Promise<Asset.Response.Detail[]>;
  PrepareUpload(kind: Kind, params: Asset.Request.PrepareUpload): Promise<Asset.Response.PrepareUpload>;
  PrepareUploads(kind: Kind, params: Asset.Request.PrepareUploads): Promise<Asset.Response.PrepareUploads>;
  ConfirmUpload(kind: Kind, params: Asset.Request.ConfirmUpload): Promise<void>;
  ConfirmUploads(kind: Kind, params: Asset.Request.ConfirmUploads): Promise<void>;
  Delete(kind: Kind, id: string): Promise<void>;
  FileURL(kind: Kind, id: string): string;
}

function kindPaths(kind: Kind) {
  switch (kind) {
    case "files":
      return URL_PATHS.ASSET.Files;
    case "videos":
      return URL_PATHS.ASSET.Videos;
    case "audios":
      return URL_PATHS.ASSET.Audios;
    default:
      return URL_PATHS.ASSET.Images;
  }
}

export class ApiAssetRepository implements AssetRepository {
  async GetErrorTranslations(lang: string): Promise<Record<string, string>> {
    const { data } = await publicClientWithoutTransform.get<Record<string, string>>(URL_PATHS.ASSET.Locales.errorsByLang(lang));
    return data;
  }

  async List(kind: Kind): Promise<Asset.Response.Detail[]> {
    const { data } = await protectedClient.get<DataResponse<Asset.Response.Detail[]>>(String(kindPaths(kind)));
    return dataFromResponse(data, `List ${kind}`);
  }

  async PrepareUpload(kind: Kind, params: Asset.Request.PrepareUpload): Promise<Asset.Response.PrepareUpload> {
    const { data } = await protectedClient.post<DataResponse<Asset.Response.PrepareUpload>>(kindPaths(kind).uploadUrl, params);
    return dataFromResponse(data, `Prepare ${kind}`);
  }

  async PrepareUploads(kind: Kind, params: Asset.Request.PrepareUploads): Promise<Asset.Response.PrepareUploads> {
    const { data } = await protectedClient.post<DataResponse<Asset.Response.PrepareUploads>>(kindPaths(kind).uploadUrls, params);
    return dataFromResponse(data, `Prepare many ${kind}`);
  }

  async ConfirmUpload(kind: Kind, params: Asset.Request.ConfirmUpload): Promise<void> {
    await protectedClient.post(kindPaths(kind).confirm, params);
  }

  async ConfirmUploads(kind: Kind, params: Asset.Request.ConfirmUploads): Promise<void> {
    await protectedClient.post(kindPaths(kind).confirmMany, params);
  }

  async Delete(kind: Kind, id: string): Promise<void> {
    await protectedClient.delete(kindPaths(kind).deleteById(id));
  }

  FileURL(kind: Kind, id: string): string {
    return `${API_ENDPOINTS.IDENTITY}${kindPaths(kind).fileById(id)}`;
  }
}
