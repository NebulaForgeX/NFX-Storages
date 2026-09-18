package storages

import "nfxstorages/pkgs/errx"

var (
	ErrUnauthorized       = errx.Unauthorized("STORAGES_UNAUTHORIZED", "unauthorized")
	ErrForbidden          = errx.Forbidden("STORAGES_FORBIDDEN", "forbidden")
	ErrNotFound           = errx.NotFound("STORAGES_NOT_FOUND", "not found")
	ErrBucketNotFound     = errx.NotFound("STORAGES_BUCKET_NOT_FOUND", "bucket not found")
	ErrObjectNotFound     = errx.NotFound("STORAGES_OBJECT_NOT_FOUND", "object not found")
	ErrBucketExists       = errx.Conflict("STORAGES_BUCKET_EXISTS", "bucket already exists")
	ErrBucketNotEmpty     = errx.Conflict("STORAGES_BUCKET_NOT_EMPTY", "bucket is not empty")
	ErrAccessDenied       = errx.Forbidden("STORAGES_ACCESS_DENIED", "access denied")
	ErrInvalidAccessKey   = errx.Unauthorized("STORAGES_INVALID_ACCESS_KEY", "invalid access key")
	ErrSignatureMismatch  = errx.Unauthorized("STORAGES_SIGNATURE_MISMATCH", "signature does not match")
	ErrInvalidToken       = errx.Unauthorized("STORAGES_INVALID_TOKEN", "invalid session token")
	ErrAccessKeyDisabled  = errx.Forbidden("STORAGES_ACCESS_KEY_DISABLED", "access key is disabled")
	ErrAccessKeyExpired   = errx.Unauthorized("STORAGES_ACCESS_KEY_EXPIRED", "access key is expired")
	ErrGroupNameRequired  = errx.InvalidArg("STORAGES_GROUP_NAME_REQUIRED", "group name is required")
	ErrIAMUserNotFound    = errx.NotFound("STORAGES_IAM_USER_NOT_FOUND", "IAM user not found")
	ErrPolicyNotFound     = errx.NotFound("STORAGES_POLICY_NOT_FOUND", "policy not found")
	ErrGroupNotFound      = errx.NotFound("STORAGES_GROUP_NOT_FOUND", "group not found")
	ErrSessionFailed      = errx.Unauthorized("STORAGES_SESSION_FAILED", "failed to issue session credentials")
	ErrVolumeMissing      = errx.Internal("STORAGES_VOLUME_MISSING", "storage volume is not configured")
	ErrNoSuchUpload       = errx.NotFound("STORAGES_NO_SUCH_UPLOAD", "multipart upload not found")
	ErrNoSuchBucketPolicy = errx.NotFound("STORAGES_NO_SUCH_BUCKET_POLICY", "bucket policy not found")
	ErrNoSuchLifecycle    = errx.NotFound("STORAGES_NO_SUCH_LIFECYCLE", "lifecycle configuration not found")
	ErrNoSuchEncryption   = errx.NotFound("STORAGES_NO_SUCH_ENCRYPTION", "encryption configuration not found")
	ErrNoSuchReplication  = errx.NotFound("STORAGES_NO_SUCH_REPLICATION", "replication configuration not found")
	ErrNoSuchObjectLock   = errx.NotFound("STORAGES_NO_SUCH_OBJECT_LOCK", "object lock configuration not found")
	ErrMethodNotAllowed   = errx.InvalidArg("STORAGES_METHOD_NOT_ALLOWED", "method not allowed")
	ErrProfileNotOwned    = errx.Forbidden("STORAGES_PROFILE_NOT_OWNED", "profile is not owned by this account")
	ErrInvalidIAMArchive  = errx.InvalidArg("STORAGES_INVALID_IAM_ARCHIVE", "invalid IAM archive")
	ErrKMSKeyNotFound     = errx.NotFound("STORAGES_KMS_KEY_NOT_FOUND", "KMS key not found")
)

/*
!STORAGES_UNAUTHORIZED
*en<Unauthorized>
*zh<未授权>
*fr<Non autorisé>

!STORAGES_FORBIDDEN
*en<Forbidden>
*zh<没有权限>
*fr<Interdit>

!STORAGES_NOT_FOUND
*en<Not found>
*zh<未找到>
*fr<Introuvable>

!STORAGES_BUCKET_NOT_FOUND
*en<Bucket not found>
*zh<存储桶不存在>
*fr<Bucket introuvable>

!STORAGES_OBJECT_NOT_FOUND
*en<Object not found>
*zh<对象不存在>
*fr<Objet introuvable>

!STORAGES_BUCKET_EXISTS
*en<Bucket already exists>
*zh<存储桶已存在>
*fr<Le bucket existe déjà>

!STORAGES_BUCKET_NOT_EMPTY
*en<Bucket is not empty>
*zh<存储桶非空>
*fr<Le bucket n'est pas vide>

!STORAGES_ACCESS_DENIED
*en<Access denied>
*zh<拒绝访问>
*fr<Accès refusé>

!STORAGES_INVALID_ACCESS_KEY
*en<Invalid access key>
*zh<访问密钥无效>
*fr<Clé d'accès invalide>

!STORAGES_SIGNATURE_MISMATCH
*en<Signature does not match>
*zh<签名不匹配>
*fr<La signature ne correspond pas>

!STORAGES_INVALID_TOKEN
*en<Invalid session token>
*zh<会话令牌无效>
*fr<Jeton de session invalide>

!STORAGES_ACCESS_KEY_DISABLED
*en<Access key is disabled>
*zh<访问密钥已禁用>
*fr<Clé d'accès désactivée>

!STORAGES_ACCESS_KEY_EXPIRED
*en<Access key is expired>
*zh<访问密钥已过期>
*fr<Clé d'accès expirée>

!STORAGES_GROUP_NAME_REQUIRED
*en<Group name is required>
*zh<组名必填>
*fr<Le nom du groupe est requis>

!STORAGES_IAM_USER_NOT_FOUND
*en<IAM user not found>
*zh<IAM 用户不存在>
*fr<Utilisateur IAM introuvable>

!STORAGES_POLICY_NOT_FOUND
*en<Policy not found>
*zh<策略不存在>
*fr<Politique introuvable>

!STORAGES_GROUP_NOT_FOUND
*en<Group not found>
*zh<组不存在>
*fr<Groupe introuvable>

!STORAGES_SESSION_FAILED
*en<Failed to issue session credentials>
*zh<签发临时凭证失败>
*fr<Échec de l'émission des identifiants de session>

!STORAGES_VOLUME_MISSING
*en<Storage volume is not configured>
*zh<存储卷未配置>
*fr<Volume de stockage non configuré>

!STORAGES_NO_SUCH_UPLOAD
*en<Multipart upload not found>
*zh<分片上传不存在>
*fr<Téléversement multipart introuvable>

!STORAGES_NO_SUCH_BUCKET_POLICY
*en<Bucket policy not found>
*zh<存储桶策略不存在>
*fr<Politique de bucket introuvable>

!STORAGES_NO_SUCH_LIFECYCLE
*en<Lifecycle configuration not found>
*zh<生命周期配置不存在>
*fr<Configuration de cycle de vie introuvable>

!STORAGES_NO_SUCH_ENCRYPTION
*en<Encryption configuration not found>
*zh<加密配置不存在>
*fr<Configuration de chiffrement introuvable>

!STORAGES_NO_SUCH_REPLICATION
*en<Replication configuration not found>
*zh<复制配置不存在>
*fr<Configuration de réplication introuvable>

!STORAGES_NO_SUCH_OBJECT_LOCK
*en<Object lock configuration not found>
*zh<对象锁定配置不存在>
*fr<Configuration de verrouillage d'objet introuvable>

!STORAGES_METHOD_NOT_ALLOWED
*en<Method not allowed>
*zh<不允许的方法>
*fr<Méthode non autorisée>

!STORAGES_PROFILE_NOT_OWNED
*en<Profile is not owned by this account>
*zh<该账号不拥有此资料>
*fr<Le profil n'appartient pas à ce compte>

!STORAGES_INVALID_IAM_ARCHIVE
*en<Invalid IAM archive>
*zh<无效的 IAM 归档>
*fr<Archive IAM invalide>

!STORAGES_KMS_KEY_NOT_FOUND
*en<KMS key not found>
*zh<KMS 密钥不存在>
*fr<Clé KMS introuvable>
*/
