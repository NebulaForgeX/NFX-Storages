export namespace Asset {
  export type Kind = "images" | "files" | "videos" | "audios";

  export namespace Request {
    export type PrepareUpload = {
      fileName: string;
      mimeType: string;
    };

    export type ConfirmUpload = {
      id: string;
    };

    export type PrepareUploads = {
      items: PrepareUpload[];
    };

    export type ConfirmUploads = {
      ids: string[];
    };
  }

  export namespace Response {
    export type PrepareUpload = {
      id: string;
      uploadUrl: string;
      filePath: string;
    };

    export type PrepareUploads = {
      results: PrepareUpload[];
    };

    export interface Detail {
      id: string;
      filePath: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      uploaderId: string;
      createdAt: string;
      updatedAt: string;
    }
  }
}
