package sys

import "nfxstorages/pkgs/errx"

// 内部错误按来源区分，每个对应明确 errCode，便于排查与前端展示
var (
	// ErrInternal 未知/未分类内部错误（如 error_handler 兜底）
	ErrInternal = errx.Internal("INTERNAL", "internal server error")
	// ErrInvalidToken 访问令牌无效或已过期
	ErrInvalidToken = errx.Unauthorized("INVALID_TOKEN", "invalid or expired token")
	// ErrInvalidAuthHeader Authorization 头缺失或格式无效（非 Bearer）
	ErrInvalidAuthHeader = errx.Unauthorized("INVALID_AUTH_HEADER", "missing or invalid Authorization header")
	// ErrGRPCAddrEmpty 未配置 gRPC 服务地址（wiring / 环境变量缺失）
	ErrGRPCAddrEmpty = errx.InvalidArg("GRPC_ADDR_EMPTY", "gRPC address is not configured")
	// ErrGRPCInternal gRPC 调用返回 Internal 或连接/调用失败
	ErrGRPCInternal = errx.Internal("GRPC_INTERNAL", "gRPC call failed")
	// ErrDatabaseInternal 数据库操作失败
	ErrDatabaseInternal = errx.Internal("DATABASE_INTERNAL", "database operation failed")
	// ErrStorageInternal 存储/文件系统操作失败
	ErrStorageInternal = errx.Internal("STORAGE_INTERNAL", "storage operation failed")

	// Centrifugo
	ErrCentrifugoAPIURLRequired          = errx.InvalidArg("CENTRIFUGO_API_URL_REQUIRED", "Centrifugo API URL is required")
	ErrCentrifugoAPIKeyRequired          = errx.InvalidArg("CENTRIFUGO_API_KEY_REQUIRED", "Centrifugo API key is required")
	ErrCentrifugoClientSecretRequired    = errx.InvalidArg("CENTRIFUGO_CLIENT_SECRET_REQUIRED", "Centrifugo client secret is required")
	ErrCentrifugoClientNotInitialized    = errx.Internal("CENTRIFUGO_CLIENT_NOT_INITIALIZED", "Centrifugo client is not initialized")
	ErrCentrifugoProfileIDRequired       = errx.InvalidArg("CENTRIFUGO_PROFILE_ID_REQUIRED", "profile ID is required")
	ErrCentrifugoPublisherNotInitialized = errx.Internal("CENTRIFUGO_PUBLISHER_NOT_INITIALIZED", "Centrifugo publisher is not initialized")
	ErrCentrifugoInternal                = errx.Internal("CENTRIFUGO_INTERNAL", "Centrifugo operation failed")

	// Kafka
	ErrKafkaBrokersEmpty         = errx.InvalidArg("KAFKA_BROKERS_EMPTY", "Kafka brokers is empty")
	ErrKafkaClientIDEmpty        = errx.InvalidArg("KAFKA_CLIENT_ID_EMPTY", "Kafka client ID is empty")
	ErrKafkaConsumerGroupIDEmpty = errx.InvalidArg("KAFKA_CONSUMER_GROUP_ID_EMPTY", "Kafka consumer group ID is empty")
	ErrKafkaInternal             = errx.Internal("KAFKA_INTERNAL", "Kafka operation failed")

	// Event bus (Kafka)
	ErrEventBusPublisherNotInitialized = errx.Internal("EVENT_BUS_PUBLISHER_NOT_INITIALIZED", "event bus publisher is not initialized")
	ErrEventBusTopicNotFound           = errx.InvalidArg("EVENT_BUS_TOPIC_NOT_FOUND", "event bus topic not found")
	ErrEventBusTopicNameEmpty          = errx.InvalidArg("EVENT_BUS_TOPIC_NAME_EMPTY", "event bus topic name is empty")
	ErrEventBusTopicNameDuplicate      = errx.InvalidArg("EVENT_BUS_TOPIC_NAME_DUPLICATE", "event bus topic name is duplicate")
	ErrEventBusMarshalFailed           = errx.Internal("EVENT_BUS_MARSHAL_FAILED", "event bus payload marshal failed")
	ErrEventBusUnmarshalFailed         = errx.Internal("EVENT_BUS_UNMARSHAL_FAILED", "event bus payload unmarshal failed")
	ErrEventBusValidationFailed        = errx.InvalidArg("EVENT_BUS_VALIDATION_FAILED", "event bus payload validation failed")
	ErrEventBusGenerateIDFailed        = errx.Internal("EVENT_BUS_GENERATE_ID_FAILED", "event bus event ID generation failed")

	// DynamoDB
	ErrDynamoDBRegionEmpty        = errx.InvalidArg("DYNAMODB_REGION_EMPTY", "DynamoDB region is empty")
	ErrDynamoDBMessagesTableEmpty = errx.InvalidArg("DYNAMODB_MESSAGES_TABLE_EMPTY", "DynamoDB messages table is empty")
	ErrDynamoDBNotInitialized     = errx.Internal("DYNAMODB_NOT_INITIALIZED", "DynamoDB client is not initialized")

	// S3
	ErrS3BucketEmpty        = errx.InvalidArg("S3_BUCKET_EMPTY", "S3 bucket is empty")
	ErrS3KeyEmpty           = errx.InvalidArg("S3_KEY_EMPTY", "S3 object key is empty")
	ErrS3PublicBaseURLEmpty = errx.InvalidArg("S3_PUBLIC_BASE_URL_EMPTY", "S3 public base URL is empty")
	ErrS3CopyKeysEmpty      = errx.InvalidArg("S3_COPY_KEYS_EMPTY", "S3 copy source and destination keys must be non-empty")

	// MongoDB
	ErrMongoDBHostEmpty      = errx.InvalidArg("MONGODB_HOST_EMPTY", "MongoDB host is required")
	ErrMongoDBDatabaseEmpty  = errx.InvalidArg("MONGODB_DATABASE_EMPTY", "MongoDB database is required")
	ErrMongoDBNotInitialized = errx.Internal("MONGODB_NOT_INITIALIZED", "MongoDB client is not initialized")

	// PostgreSQL
	ErrPostgreSQLNotInitialized = errx.Internal("POSTGRESQL_NOT_INITIALIZED", "PostgreSQL connection is not initialized")
	ErrPostgreSQLConfigInvalid  = errx.InvalidArg("POSTGRESQL_CONFIG_INVALID", "PostgreSQL config is invalid")

	// MySQL
	ErrMySQLNotInitialized = errx.Internal("MYSQL_NOT_INITIALIZED", "MySQL connection is not initialized")
	ErrMySQLConfigInvalid  = errx.InvalidArg("MYSQL_CONFIG_INVALID", "MySQL config is invalid")

	// OpenSearch
	ErrOpenSearchConfigInvalid  = errx.InvalidArg("OPENSEARCH_CONFIG_INVALID", "OpenSearch config is invalid")
	ErrOpenSearchNotInitialized = errx.Internal("OPENSEARCH_NOT_INITIALIZED", "OpenSearch client is not initialized")
	ErrOpenSearchInternal       = errx.Internal("OPENSEARCH_INTERNAL", "OpenSearch operation failed")

	// Token (JWT)
	ErrTokenInvalidType          = errx.Unauthorized("TOKEN_INVALID_TYPE", "invalid token type")
	ErrTokenInvalidSigningMethod = errx.Unauthorized("TOKEN_INVALID_SIGNING_METHOD", "invalid token signing method")
	ErrTokenInvalidIssuer        = errx.Unauthorized("TOKEN_INVALID_ISSUER", "invalid token issuer")
	ErrTokenInvalidProfileScope  = errx.Unauthorized("TOKEN_INVALID_PROFILE_SCOPE", "invalid token profile scope")
	ErrTokenInternal             = errx.Internal("TOKEN_INTERNAL", "token operation failed")

	// Config loader
	ErrConfigInternal       = errx.Internal("CONFIG_INTERNAL", "config operation failed")
	ErrConfigMissingEnvVars = errx.InvalidArg("CONFIG_MISSING_ENV_VARS", "required environment variables are missing")

	// Email
	ErrEmailInternal        = errx.Internal("EMAIL_INTERNAL", "email operation failed")
	ErrEmailTemplateInvalid = errx.InvalidArg("EMAIL_TEMPLATE_INVALID", "email template is invalid")
	ErrEmailI18nInvalid     = errx.InvalidArg("EMAIL_I18N_INVALID", "email i18n data is invalid")

	// Geo
	ErrGeoRegionTypeInvalid    = errx.InvalidArg("GEO_REGION_TYPE_INVALID", "invalid region type")
	ErrGeoRegionCoordsInvalid  = errx.InvalidArg("GEO_REGION_COORDS_INVALID", "region coordinates out of range")
	ErrGeoRegionCircleShape    = errx.InvalidArg("GEO_REGION_CIRCLE_SHAPE", "circle region requires exactly one center point and a positive radius")
	ErrGeoRegionLineShape      = errx.InvalidArg("GEO_REGION_LINE_SHAPE", "line region requires at least two points")
	ErrGeoRegionPolygonShape   = errx.InvalidArg("GEO_REGION_POLYGON_SHAPE", "polygon region requires at least three points")
	ErrGeoRegionTooManyPoints  = errx.InvalidArg("GEO_REGION_TOO_MANY_POINTS", "region has too many points")
	ErrGeoRegionRadiusMismatch = errx.InvalidArg("GEO_REGION_RADIUS_MISMATCH", "region radius is only allowed for circle regions")
	ErrGeoRegionEncodeFailed   = errx.Internal("GEO_REGION_ENCODE_FAILED", "failed to encode region geometry")

	// Utils
	ErrTimexEmptyTimestamp = errx.InvalidArg("TIMEX_EMPTY_TIMESTAMP", "timestamp is empty")
	ErrTimexParseFailed    = errx.InvalidArg("TIMEX_PARSE_FAILED", "timestamp parse failed")
	ErrMapKeyNotFound      = errx.InvalidArg("MAP_KEY_NOT_FOUND", "map key not found")
	ErrMapKeyTypeMismatch  = errx.InvalidArg("MAP_KEY_TYPE_MISMATCH", "map key type mismatch")

	// Rate limit
	ErrRateLimitUnknownDecision = errx.Internal("RATE_LIMIT_UNKNOWN_DECISION", "rate limit unknown decision code")

	// Upstream (Link gRPC / clients) — Near-owned codes; never re-export Link auth/asset err codes.
	ErrUpstreamNotFound         = errx.NotFound("UPSTREAM_NOT_FOUND", "upstream resource not found")
	ErrUpstreamInvalidResponse  = errx.InvalidArg("UPSTREAM_INVALID_RESPONSE", "upstream returned invalid data")
)

/*
!INTERNAL
*en<Internal server error>
*zh<服务器内部错误>
*fr<erreur interne du serveur>
*p*en<Sorry, something went wrong on our end. Please try again later.>
*p*zh<抱歉，出现了意外问题，这是我们的问题，请稍后再试。>
*p*fr<Désolé, une erreur inattendue s'est produite de notre côté. Veuillez réessayer plus tard.>

!INVALID_TOKEN
*en<Invalid or expired token>
*zh<令牌无效或已过期>
*fr<jeton invalide ou expiré>
*p*en<Your session may have expired. Please sign in again.>
*p*zh<登录状态可能已失效，请重新登录。>
*p*fr<Votre session a peut-être expiré. Veuillez vous reconnecter.>

!INVALID_AUTH_HEADER
*en<Missing or invalid Authorization header>
*zh<缺少或无效的 Authorization 请求头>
*fr<En-tête Authorization manquant ou invalide>
*p*en<You are not signed in. Please sign in and try again.>
*p*zh<当前未登录，请重新登录后再试。>
*p*fr<Vous n'êtes pas connecté. Veuillez vous connecter et réessayer.>

!GRPC_ADDR_EMPTY
*en<gRPC address is not configured>
*zh<gRPC 服务地址未配置>
*fr<adresse gRPC non configurée>
*p*en<Sorry, some features are temporarily unavailable. Please try again later.>
*p*zh<抱歉，部分功能暂时不可用，请稍后再试。>
*p*fr<Désolé, certaines fonctionnalités sont temporairement indisponibles. Veuillez réessayer plus tard.>

!GRPC_INTERNAL
*en<GRPC call failed>
*zh<gRPC 调用失败>
*fr<échec de l'appel gRPC>

!DATABASE_INTERNAL
*en<Database operation failed>
*zh<数据库操作失败>
*fr<échec de l'opération base de données>

!STORAGE_INTERNAL
*en<Storage operation failed>
*zh<存储操作失败>
*fr<échec de l'opération de stockage>

!CENTRIFUGO_API_URL_REQUIRED
*en<Centrifugo API URL is required>
*zh<Centrifugo API URL 未配置>
*fr<L'URL API Centrifugo est requise>

!CENTRIFUGO_API_KEY_REQUIRED
*en<Centrifugo API key is required>
*zh<Centrifugo API key 未配置>
*fr<La clé API Centrifugo est requise>

!CENTRIFUGO_CLIENT_SECRET_REQUIRED
*en<Centrifugo client secret is required>
*zh<Centrifugo client secret 未配置>
*fr<Le secret client Centrifugo est requis>

!CENTRIFUGO_CLIENT_NOT_INITIALIZED
*en<Centrifugo client is not initialized>
*zh<Centrifugo 客户端未初始化>
*fr<Le client Centrifugo n'est pas initialisé>

!CENTRIFUGO_PROFILE_ID_REQUIRED
*en<profile ID is required>
*zh<profile ID 不能为空>
*fr<L'identifiant de profil est requis>

!CENTRIFUGO_PUBLISHER_NOT_INITIALIZED
*en<Centrifugo publisher is not initialized>
*zh<Centrifugo 发布器未初始化>
*fr<Le publisher Centrifugo n'est pas initialisé>

!CENTRIFUGO_INTERNAL
*en<Centrifugo operation failed>
*zh<Centrifugo 操作失败>
*fr<Échec de l'opération Centrifugo>

!KAFKA_BROKERS_EMPTY
*en<Kafka brokers is empty>
*zh<Kafka brokers 未配置>
*fr<Les brokers Kafka sont vides>

!KAFKA_CLIENT_ID_EMPTY
*en<Kafka client ID is empty>
*zh<Kafka client ID 未配置>
*fr<L'identifiant client Kafka est vide>

!KAFKA_CONSUMER_GROUP_ID_EMPTY
*en<Kafka consumer group ID is empty>
*zh<Kafka consumer group ID 未配置>
*fr<L'identifiant du groupe consommateur Kafka est vide>

!KAFKA_INTERNAL
*en<Kafka operation failed>
*zh<Kafka 操作失败>
*fr<Échec de l'opération Kafka>

!EVENT_BUS_PUBLISHER_NOT_INITIALIZED
*en<event bus publisher is not initialized>
*zh<事件总线发布器未初始化>
*fr<Le publisher du bus d'événements n'est pas initialisé>

!EVENT_BUS_TOPIC_NOT_FOUND
*en<event bus topic not found>
*zh<事件总线 topic 未找到>
*fr<Topic du bus d'événements introuvable>

!EVENT_BUS_TOPIC_NAME_EMPTY
*en<event bus topic name is empty>
*zh<事件总线 topic 名称为空>
*fr<Le nom du topic du bus d'événements est vide>

!EVENT_BUS_TOPIC_NAME_DUPLICATE
*en<event bus topic name is duplicate>
*zh<事件总线 topic 名称重复>
*fr<Le nom du topic du bus d'événements est dupliqué>

!EVENT_BUS_MARSHAL_FAILED
*en<event bus payload marshal failed>
*zh<事件总线 payload 序列化失败>
*fr<Échec de la sérialisation du payload du bus d'événements>

!EVENT_BUS_UNMARSHAL_FAILED
*en<event bus payload unmarshal failed>
*zh<事件总线 payload 反序列化失败>
*fr<Échec de la désérialisation du payload du bus d'événements>

!EVENT_BUS_VALIDATION_FAILED
*en<event bus payload validation failed>
*zh<事件总线 payload 校验失败>
*fr<Échec de la validation du payload du bus d'événements>

!EVENT_BUS_GENERATE_ID_FAILED
*en<event bus event ID generation failed>
*zh<事件总线 event ID 生成失败>
*fr<Échec de la génération de l'ID d'événement du bus>

!DYNAMODB_REGION_EMPTY
*en<DynamoDB region is empty>
*zh<DynamoDB region 未配置>
*fr<La région DynamoDB est vide>

!DYNAMODB_MESSAGES_TABLE_EMPTY
*en<DynamoDB messages table is empty>
*zh<DynamoDB messages 表未配置>
*fr<La table messages DynamoDB est vide>

!DYNAMODB_NOT_INITIALIZED
*en<DynamoDB client is not initialized>
*zh<DynamoDB 客户端未初始化>
*fr<Le client DynamoDB n'est pas initialisé>

!S3_BUCKET_EMPTY
*en<S3 bucket is empty>
*zh<S3 bucket 未配置>
*fr<Le bucket S3 est vide>

!S3_KEY_EMPTY
*en<S3 object key is empty>
*zh<S3 object key 为空>
*fr<La clé d'objet S3 est vide>

!S3_PUBLIC_BASE_URL_EMPTY
*en<S3 public base URL is empty>
*zh<S3 public base URL 未配置>
*fr<L'URL publique de base S3 est vide>

!S3_COPY_KEYS_EMPTY
*en<S3 copy source and destination keys must be non-empty>
*zh<S3 复制源与目标 key 不能为空>
*fr<Les clés source et destination de copie S3 doivent être non vides>

!MONGODB_HOST_EMPTY
*en<MongoDB host is required>
*zh<MongoDB host 未配置>
*fr<L'hôte MongoDB est requis>

!MONGODB_DATABASE_EMPTY
*en<MongoDB database is required>
*zh<MongoDB database 未配置>
*fr<La base MongoDB est requise>

!MONGODB_NOT_INITIALIZED
*en<MongoDB client is not initialized>
*zh<MongoDB 客户端未初始化>
*fr<Le client MongoDB n'est pas initialisé>

!POSTGRESQL_NOT_INITIALIZED
*en<PostgreSQL connection is not initialized>
*zh<PostgreSQL 连接未初始化>
*fr<La connexion PostgreSQL n'est pas initialisée>

!POSTGRESQL_CONFIG_INVALID
*en<PostgreSQL config is invalid>
*zh<PostgreSQL 配置无效>
*fr<La configuration PostgreSQL est invalide>

!MYSQL_NOT_INITIALIZED
*en<MySQL connection is not initialized>
*zh<MySQL 连接未初始化>
*fr<La connexion MySQL n'est pas initialisée>

!MYSQL_CONFIG_INVALID
*en<MySQL config is invalid>
*zh<MySQL 配置无效>
*fr<La configuration MySQL est invalide>

!OPENSEARCH_CONFIG_INVALID
*en<OpenSearch config is invalid>
*zh<OpenSearch 配置无效>
*fr<La configuration OpenSearch est invalide>

!OPENSEARCH_NOT_INITIALIZED
*en<OpenSearch client is not initialized>
*zh<OpenSearch 客户端未初始化>
*fr<Le client OpenSearch n'est pas initialisé>

!OPENSEARCH_INTERNAL
*en<OpenSearch operation failed>
*zh<OpenSearch 操作失败>
*fr<Échec de l'opération OpenSearch>

!TOKEN_INVALID_TYPE
*en<invalid token type>
*zh<令牌类型无效>
*fr<Type de jeton invalide>

!TOKEN_INVALID_SIGNING_METHOD
*en<invalid token signing method>
*zh<令牌签名算法无效>
*fr<Méthode de signature du jeton invalide>

!TOKEN_INVALID_ISSUER
*en<invalid token issuer>
*zh<令牌签发者无效>
*fr<Émetteur du jeton invalide>

!TOKEN_INVALID_PROFILE_SCOPE
*en<invalid token profile scope>
*zh<令牌资料域无效>
*fr<Portée de profil du jeton invalide>

!TOKEN_INTERNAL
*en<token operation failed>
*zh<令牌操作失败>
*fr<Échec de l'opération sur le jeton>

!CONFIG_INTERNAL
*en<config operation failed>
*zh<配置操作失败>
*fr<Échec de l'opération de configuration>

!CONFIG_MISSING_ENV_VARS
*en<required environment variables are missing>
*zh<缺少必需的环境变量>
*fr<Variables d'environnement requises manquantes>

!EMAIL_INTERNAL
*en<email operation failed>
*zh<邮件操作失败>
*fr<Échec de l'opération e-mail>

!EMAIL_TEMPLATE_INVALID
*en<email template is invalid>
*zh<邮件模板无效>
*fr<Modèle e-mail invalide>

!EMAIL_I18N_INVALID
*en<email i18n data is invalid>
*zh<邮件 i18n 数据无效>
*fr<Données i18n e-mail invalides>

!GEO_REGION_TYPE_INVALID
*en<Invalid region type>
*zh<范围类型无效>
*fr<type de zone invalide>

!GEO_REGION_COORDS_INVALID
*en<Region coordinates out of range>
*zh<范围坐标超出有效范围>
*fr<coordonnées de zone hors limites>

!GEO_REGION_CIRCLE_SHAPE
*en<Circle region requires exactly one center point and a positive radius>
*zh<圆形范围需要一个圆心和大于 0 的半径>
*fr<la zone circulaire nécessite un centre et un rayon positif>

!GEO_REGION_LINE_SHAPE
*en<Line region requires at least two points>
*zh<线段范围至少需要两个点>
*fr<la zone linéaire nécessite au moins deux points>

!GEO_REGION_POLYGON_SHAPE
*en<Polygon region requires at least three points>
*zh<多边形范围至少需要三个顶点>
*fr<la zone polygonale nécessite au moins trois points>

!GEO_REGION_TOO_MANY_POINTS
*en<Region has too many points>
*zh<范围顶点数量过多>
*fr<la zone contient trop de points>

!GEO_REGION_RADIUS_MISMATCH
*en<Region radius is only allowed for circle regions>
*zh<仅圆形范围允许设置半径>
*fr<le rayon n'est autorisé que pour les zones circulaires>

!GEO_REGION_ENCODE_FAILED
*en<failed to encode region geometry>
*zh<区域几何编码失败>
*fr<Échec de l'encodage de la géométrie de région>

!TIMEX_EMPTY_TIMESTAMP
*en<timestamp is empty>
*zh<时间戳为空>
*fr<L'horodatage est vide>

!TIMEX_PARSE_FAILED
*en<timestamp parse failed>
*zh<时间戳解析失败>
*fr<Échec de l'analyse de l'horodatage>

!MAP_KEY_NOT_FOUND
*en<map key not found>
*zh<map key 未找到>
*fr<Clé de map introuvable>

!MAP_KEY_TYPE_MISMATCH
*en<map key type mismatch>
*zh<map key 类型不匹配>
*fr<Type de clé de map incompatible>

!RATE_LIMIT_UNKNOWN_DECISION
*en<rate limit unknown decision code>
*zh<限流未知决策码>
*fr<Code de décision de limitation inconnue>

!UPSTREAM_NOT_FOUND
*en<Upstream resource not found>
*zh<上游资源不存在>
*fr<Ressource amont introuvable>

!UPSTREAM_INVALID_RESPONSE
*en<Upstream returned invalid data>
*zh<上游返回了无效数据>
*fr<Données amont invalides>

!METHOD_NOT_ALLOWED
*en<Method not allowed>
*zh<不允许的请求方法>
*fr<Méthode non autorisée>

!NOT_FOUND
*en<Not found>
*zh<未找到>
*fr<Introuvable>

!BAD_REQUEST
*en<Bad request>
*zh<请求错误>
*fr<Requête invalide>
*/
