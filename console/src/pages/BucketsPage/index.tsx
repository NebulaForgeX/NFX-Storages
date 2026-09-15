import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { Button, Card, Flex, Text } from "@radix-ui/themes";
import { Settings, Shield, KeyRound, Lock } from "lucide-react";
import { CardHeader, EmptyState, PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useStorageRepositories } from "@/hooks/storages";

export default function BucketsPage() {
  const { buckets: bucketRepository } = useStorageRepositories();
  const { t } = useTranslation("common");
  const params = useParams();
  const bucket = decodeURIComponent(params.key ?? "");
  const { data, isLoading, error } = useQuery({
    queryKey: ["bucket-settings", bucket],
    enabled: Boolean(bucket),
    queryFn: async () => {
      const [versioning, policy, encryption] = await Promise.allSettled([
        bucketRepository.getBucketVersioning(bucket),
        bucketRepository.getBucketPolicy(bucket),
        bucketRepository.getBucketEncryption(bucket),
      ]);
      return {
        versioning: versioning.status === "fulfilled" ? versioning.value.Status : "-",
        policy: policy.status === "fulfilled" ? policy.value.Policy : "",
        encryption: encryption.status === "fulfilled" ? JSON.stringify(encryption.value.ServerSideEncryptionConfiguration) : "",
      };
    },
  });

  return (
    <PageFrame>
      <PageHeader icon={Settings} title={bucket} description={t("Settings")} />
      {isLoading ? <EmptyState icon={Settings} title={t("Loading")} /> : null}
      {error ? <EmptyState icon={Settings} title={error instanceof Error ? error.message : t("Failed to fetch data")} /> : null}
      {data ? (
        <Flex direction="column" gap="4">
          <Card>
            <CardHeader icon={<Shield size={18} />} title={t("Versioning")} />
            <Text>{String(data.versioning ?? "-")}</Text>
          </Card>
          <Card>
            <CardHeader icon={<KeyRound size={18} />} title={t("Access Policy")} />
            <pre style={{ whiteSpace: "pre-wrap" }}>{data.policy || "-"}</pre>
          </Card>
          <Card>
            <CardHeader icon={<Lock size={18} />} title={t("Encryption")} />
            <pre style={{ whiteSpace: "pre-wrap" }}>{data.encryption || "-"}</pre>
          </Card>
          <Button asChild>
            <a href={`/browser/${encodeURIComponent(bucket)}`}>{t("Browser")}</a>
          </Button>
        </Flex>
      ) : null}
    </PageFrame>
  );
}
