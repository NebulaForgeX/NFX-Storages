import {
  DeleteObjectCommand,
  DeleteObjectTaggingCommand,
  GetObjectCommand,
  GetObjectLegalHoldCommand,
  GetObjectRetentionCommand,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  ObjectLockRetentionMode,
  PutObjectCommand,
  PutObjectLegalHoldCommand,
  PutObjectRetentionCommand,
  PutObjectTaggingCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as signUrl } from "@aws-sdk/s3-request-presigner";

import { createS3Client } from "@/apis/clients";

export function objectRepository(bucket: string) {
  const client = () => createS3Client();

  const deleteObject = (key: string, versionId?: string) =>
    client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key, ...(versionId ? { VersionId: versionId } : {}) }));

  return {
    headObject: (key: string) => client().send(new HeadObjectCommand({ Bucket: bucket, Key: key })),
    getSignedUrl: (key: string, expiresIn = 3600) =>
      signUrl(client(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn }),
    putObject: (key: string, body: Blob | string) => client().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body })),
    deleteObject,
    listObject: (prefix?: string, pageSize = 25, continuationToken?: string) =>
      client().send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          MaxKeys: pageSize,
          Delimiter: "/",
          ContinuationToken: continuationToken,
        }),
      ),
    async getObjectInfo(key: string) {
      const [meta, signedUrl] = await Promise.all([
        client().send(new HeadObjectCommand({ Bucket: bucket, Key: key })),
        signUrl(client(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 }),
      ]);
      return { ...meta, Key: key, SignedUrl: signedUrl };
    },
    async getObjectTags(key: string) {
      const response = await client().send(new GetObjectTaggingCommand({ Bucket: bucket, Key: key }));
      return (response.TagSet ?? []).map((tag) => ({ Key: tag.Key ?? "", Value: tag.Value ?? "" }));
    },
    putObjectTags: (key: string, tags: Array<{ Key: string; Value: string }>) =>
      client().send(
        new PutObjectTaggingCommand({
          Bucket: bucket,
          Key: key,
          Tagging: { TagSet: tags.filter((tag) => tag.Key && tag.Value) },
        }),
      ),
    deleteObjectTags: (key: string) => client().send(new DeleteObjectTaggingCommand({ Bucket: bucket, Key: key })),
    getObjectRetention: (key: string) => client().send(new GetObjectRetentionCommand({ Bucket: bucket, Key: key })),
    putObjectRetention: (key: string, retention: { Mode: "GOVERNANCE" | "COMPLIANCE"; RetainUntilDate?: string }) =>
      client().send(
        new PutObjectRetentionCommand({
          Bucket: bucket,
          Key: key,
          Retention: {
            Mode: retention.Mode === "COMPLIANCE" ? ObjectLockRetentionMode.COMPLIANCE : ObjectLockRetentionMode.GOVERNANCE,
            ...(retention.RetainUntilDate ? { RetainUntilDate: new Date(retention.RetainUntilDate) } : {}),
          },
        }),
      ),
    getObjectLegalHold: (key: string) => client().send(new GetObjectLegalHoldCommand({ Bucket: bucket, Key: key })),
    putObjectLegalHold: (key: string, legalHold: { Status: "ON" | "OFF" }) =>
      client().send(new PutObjectLegalHoldCommand({ Bucket: bucket, Key: key, LegalHold: legalHold })),
    async listObjectVersions(key: string) {
      const res = await client().send(new ListObjectVersionsCommand({ Bucket: bucket, Prefix: key, Delimiter: "/" }));
      const Versions = (res.Versions ?? []).filter((v) => v.Key === key);
      const DeleteMarkers = (res.DeleteMarkers ?? []).filter((m) => m.Key === key);
      Versions.sort((a, b) => +new Date(b.LastModified ?? 0) - +new Date(a.LastModified ?? 0));
      DeleteMarkers.sort((a, b) => +new Date(b.LastModified ?? 0) - +new Date(a.LastModified ?? 0));
      return { ...res, Versions, DeleteMarkers };
    },
    async deleteAllVersions(key: string) {
      const versions = await this.listObjectVersions(key);
      await Promise.all([
        ...(versions.Versions ?? []).map((version) => deleteObject(key, version.VersionId)),
        ...(versions.DeleteMarkers ?? []).map((marker) => deleteObject(key, marker.VersionId)),
      ]);
      return { success: true };
    },
  };
}
