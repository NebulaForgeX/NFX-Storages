/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_PORT?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_SERVER_HOST?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_IDENTITY_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_S3_ENDPOINT?: string;
  readonly VITE_S3_REGION?: string;
  readonly VITE_SESSION_DURATION_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
