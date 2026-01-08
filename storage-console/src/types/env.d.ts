// 环境变量类型定义
declare global {
  interface ImportMetaEnv {
    readonly VITE_BUILD_ENV: "dev" | "prod";
    readonly VITE_APP_ID: string;
    readonly VITE_API_URL: string;
    readonly VITE_WS_URL: string;
    readonly VITE_IMAGE_URL?: string; // 图片服务 URL（可选，如果没有则根据 API_URL 推断）
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
