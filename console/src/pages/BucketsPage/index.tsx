import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { Settings } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { bucketRepository } from "@/apis/repositories";

export default function BucketsPage() {
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
      {isLoading ? <Text>{t("Loading")}</Text> : null}
      {error ? (
        <Text color="red">{error instanceof Error ? error.message : t("Failed to fetch data")}</Text>
      ) : null}
      {data ? (
        <Flex direction="column" gap="4">
          <Heading size="4">{t("Versioning")}</Heading>
          <Text>{String(data.versioning ?? "-")}</Text>
          <Heading size="4">{t("Access Policy")}</Heading>
          <pre style={{ whiteSpace: "pre-wrap" }}>{data.policy || "-"}</pre>
          <Heading size="4">{t("Encryption")}</Heading>
          <pre style={{ whiteSpace: "pre-wrap" }}>{data.encryption || "-"}</pre>
          <Button asChild>
            <a href={`/browser/${encodeURIComponent(bucket)}`}>{t("Browser")}</a>
          </Button>
        </Flex>
      ) : null}
    </PageFrame>
  );
}
