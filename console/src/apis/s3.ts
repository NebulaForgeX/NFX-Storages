import { S3Client } from "@aws-sdk/client-s3";
import type { DeserializeHandler, DeserializeHandlerArguments, DeserializeHandlerOutput } from "@aws-sdk/types";

import ApiClient from "@/utils/api-client";
import { AwsClient } from "@/utils/aws4fetch";
import { ApiErrorHandler } from "@/utils/api-error-handler";
import { AuthStore } from "@/stores/authStore";
import { configManager } from "@/utils/config";
import type { SiteConfig } from "@/types/config";

let cachedSiteConfig: SiteConfig | null = null;

export async function loadSiteConfig(): Promise<SiteConfig> {
  cachedSiteConfig = await configManager.loadConfig();
  return cachedSiteConfig;
}

export function getSiteConfig(): SiteConfig {
  return cachedSiteConfig ?? configManager.getCurrentHostConfig();
}

function getCredentials() {
  return AuthStore.getState().credentials;
}

export function createAdminApiClient(): ApiClient {
  const siteConfig = getSiteConfig();
  const credentials = getCredentials();
  const aws = new AwsClient({
    accessKeyId: credentials.AccessKeyId || "",
    secretAccessKey: credentials.SecretAccessKey || "",
    sessionToken: credentials.SessionToken || "",
    region: siteConfig.s3.region || "us-east-1",
    service: "s3",
  });
  return new ApiClient(aws, {
    baseUrl: siteConfig.api.baseURL,
    headers: { "Content-Type": "application/json" },
    errorHandler: new ApiErrorHandler({
      onUnauthorized: async () => {
        AuthStore.getState().clearAuth();
        window.location.reload();
      },
    }),
  });
}

interface S3Response {
  response?: { body?: string };
  [key: string]: unknown;
}

export function createS3Client(): S3Client {
  const siteConfig = getSiteConfig();
  const credentials = getCredentials();
  const client = new S3Client({
    endpoint: siteConfig.s3.endpoint,
    region: siteConfig.s3.region || "us-east-1",
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: credentials.AccessKeyId || "",
      secretAccessKey: credentials.SecretAccessKey || "",
      sessionToken: credentials.SessionToken || "",
    },
  });

  client.middlewareStack.add(
    (next: DeserializeHandler<any, any>) =>
      async (args: DeserializeHandlerArguments<any>): Promise<DeserializeHandlerOutput<any>> => {
        try {
          const response = (await next(args)) as S3Response;
          if (response.response?.body && typeof response.response.body === "string") {
            const body = response.response.body.trim();
            if (body.match(/^<\?xml[^>]*\?><[^>]*><\/[^>]*>$/)) {
              const tagName = body.match(/<([^>]*)><\/\1>/)?.[1];
              if (tagName) {
                const propertyName = tagName.replace(/(?:^|_)([a-z])/g, (_, letter: string) => letter.toUpperCase());
                return {
                  response: response.response,
                  [propertyName]: null,
                } as unknown as DeserializeHandlerOutput<object>;
              }
            }
          }
          return response as DeserializeHandlerOutput<object>;
        } catch (error: unknown) {
          const err = error as { $metadata?: { httpStatusCode?: number }; Code?: string };
          if (err?.$metadata?.httpStatusCode === 401) {
            AuthStore.getState().clearAuth();
            window.location.reload();
            return { response: { statusCode: 401, headers: {} } } as DeserializeHandlerOutput<object>;
          }
          if (err?.Code) throw new Error(err.Code);
          throw error;
        }
      },
    { step: "deserialize", name: "handleXmlResponse" },
  );

  return client;
}
