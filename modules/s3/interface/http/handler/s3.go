package handler

import (
	"encoding/xml"
	"errors"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"nfxstorages/engine/store"
	storageserr "nfxstorages/errors/src/storages"
	s3app "nfxstorages/modules/s3/application/s3"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type S3Handler struct {
	svc *s3app.Service
}

func NewS3Handler(svc *s3app.Service) *S3Handler {
	return &S3Handler{svc: svc}
}

type fiberHdr struct{ c fiber.Ctx }

func (h fiberHdr) Get(key string) string { return h.c.Get(key) }
func (h fiberHdr) Host() string          { return h.c.Get("Host") }
func (h fiberHdr) Method() string        { return h.c.Method() }
func (h fiberHdr) Path() string          { return h.c.Path() }
func (h fiberHdr) Query() string         { return string(h.c.Request().URI().QueryString()) }

func (h *S3Handler) authorize(c fiber.Ctx, body []byte) error {
	ak, err := h.svc.AuthorizeSigV4(fiberHdr{c}, body, c.Get("Authorization"), c.Get("X-Amz-Security-Token"))
	if err != nil {
		return s3authErr(err)
	}
	c.Locals("access_key", ak)
	return nil
}

func (h *S3Handler) callerAccount(c fiber.Ctx) string {
	ak, _ := c.Locals("access_key").(string)
	if ak == "" {
		return ""
	}
	row, err := h.svc.Lookup(ak)
	if err != nil || row.AccountID == nil {
		return ""
	}
	return *row.AccountID
}

func s3authErr(err error) error {
	if err == nil {
		return nil
	}
	switch {
	case errors.Is(err, storageserr.ErrInvalidAccessKey):
		return fiber.NewError(fiber.StatusForbidden, "InvalidAccessKeyId")
	case errors.Is(err, storageserr.ErrSignatureMismatch):
		return fiber.NewError(fiber.StatusForbidden, "SignatureDoesNotMatch")
	case errors.Is(err, storageserr.ErrInvalidToken), errors.Is(err, storageserr.ErrAccessKeyExpired):
		return fiber.NewError(fiber.StatusForbidden, "InvalidToken")
	case errors.Is(err, storageserr.ErrAccessKeyDisabled), errors.Is(err, storageserr.ErrAccessDenied), errors.Is(err, store.ErrForbidden):
		return fiber.NewError(fiber.StatusForbidden, "AccessDenied")
	default:
		return fiber.NewError(fiber.StatusForbidden, "AccessDenied")
	}
}

func s3err(err error) error {
	if err == nil {
		return nil
	}
	switch {
	case errors.Is(err, store.ErrForbidden), errors.Is(err, storageserr.ErrAccessDenied):
		return fiber.NewError(fiber.StatusForbidden, "AccessDenied")
	case errors.Is(err, storageserr.ErrObjectNotFound):
		return fiber.NewError(fiber.StatusNotFound, "NoSuchKey")
	case errors.Is(err, store.ErrNotFound), errors.Is(err, storageserr.ErrBucketNotFound):
		return fiber.NewError(fiber.StatusNotFound, "NoSuchBucket")
	case errors.Is(err, store.ErrBucketExists), errors.Is(err, storageserr.ErrBucketExists):
		return fiber.NewError(fiber.StatusConflict, "BucketAlreadyExists")
	case errors.Is(err, store.ErrBucketNotEmpty), errors.Is(err, storageserr.ErrBucketNotEmpty):
		return fiber.NewError(fiber.StatusConflict, "BucketNotEmpty")
	case errors.Is(err, storageserr.ErrNoSuchUpload):
		return fiber.NewError(fiber.StatusNotFound, "NoSuchUpload")
	case errors.Is(err, storageserr.ErrNoSuchBucketPolicy):
		return fiber.NewError(fiber.StatusNotFound, "NoSuchBucketPolicy")
	case errors.Is(err, storageserr.ErrNoSuchLifecycle):
		return fiber.NewError(fiber.StatusNotFound, "NoSuchLifecycleConfiguration")
	case errors.Is(err, storageserr.ErrNoSuchEncryption):
		return fiber.NewError(fiber.StatusNotFound, "ServerSideEncryptionConfigurationNotFoundError")
	case errors.Is(err, storageserr.ErrNoSuchReplication):
		return fiber.NewError(fiber.StatusNotFound, "ReplicationConfigurationNotFoundError")
	case errors.Is(err, storageserr.ErrNoSuchObjectLock):
		return fiber.NewError(fiber.StatusNotFound, "ObjectLockConfigurationNotFoundError")
	case errors.Is(err, storageserr.ErrMethodNotAllowed):
		return fiber.NewError(fiber.StatusMethodNotAllowed, "MethodNotAllowed")
	default:
		return err
	}
}

func xmlOut(c fiber.Ctx, status int, v any) error {
	c.Set("Content-Type", "application/xml")
	b, err := xml.Marshal(v)
	if err != nil {
		return err
	}
	c.Status(status)
	return c.Send(append([]byte(xml.Header), b...))
}

type listAllMyBuckets struct {
	XMLName xml.Name `xml:"ListAllMyBucketsResult"`
	Owner   struct {
		ID          string `xml:"ID"`
		DisplayName string `xml:"DisplayName"`
	} `xml:"Owner"`
	Buckets struct {
		Bucket []struct {
			Name         string `xml:"Name"`
			CreationDate string `xml:"CreationDate"`
		} `xml:"Bucket"`
	} `xml:"Buckets"`
}

type listBucketResult struct {
	XMLName               xml.Name      `xml:"ListBucketResult"`
	Name                  string        `xml:"Name"`
	Prefix                string        `xml:"Prefix"`
	Delimiter             string        `xml:"Delimiter,omitempty"`
	MaxKeys               int           `xml:"MaxKeys"`
	IsTruncated           bool          `xml:"IsTruncated"`
	KeyCount              int           `xml:"KeyCount"`
	ContinuationToken     string        `xml:"ContinuationToken,omitempty"`
	NextContinuationToken string        `xml:"NextContinuationToken,omitempty"`
	StartAfter            string        `xml:"StartAfter,omitempty"`
	Contents              []listContent `xml:"Contents"`
	CommonPrefixes        []struct {
		Prefix string `xml:"Prefix"`
	} `xml:"CommonPrefixes"`
}

type listContent struct {
	Key          string `xml:"Key"`
	LastModified string `xml:"LastModified"`
	ETag         string `xml:"ETag"`
	Size         int64  `xml:"Size"`
	StorageClass string `xml:"StorageClass"`
}

type initiateMultipart struct {
	XMLName  xml.Name `xml:"InitiateMultipartUploadResult"`
	Bucket   string   `xml:"Bucket"`
	Key      string   `xml:"Key"`
	UploadID string   `xml:"UploadId"`
}

type completeMultipart struct {
	XMLName  xml.Name `xml:"CompleteMultipartUploadResult"`
	Location string   `xml:"Location"`
	Bucket   string   `xml:"Bucket"`
	Key      string   `xml:"Key"`
	ETag     string   `xml:"ETag"`
}

type assumeRoleResult struct {
	XMLName xml.Name `xml:"AssumeRoleResponse"`
	Result  struct {
		Credentials struct {
			AccessKeyId     string `xml:"AccessKeyId"`
			SecretAccessKey string `xml:"SecretAccessKey"`
			SessionToken    string `xml:"SessionToken"`
			Expiration      string `xml:"Expiration"`
		} `xml:"Credentials"`
	} `xml:"AssumeRoleResult"`
}

func (h *S3Handler) Handle(c fiber.Ctx) error {
	body := append([]byte{}, c.Body()...)
	path := strings.TrimPrefix(c.Path(), "/")
	qs := string(c.Request().URI().QueryString())
	values, _ := url.ParseQuery(qs)

	if c.Method() == fiber.MethodPost && (values.Get("Action") == "AssumeRole" || strings.Contains(string(body), "Action=AssumeRole")) {
		return h.assumeRole(c, body)
	}

	if err := h.authorize(c, body); err != nil {
		return err
	}

	if path == "" {
		switch c.Method() {
		case fiber.MethodGet:
			return h.listBuckets(c)
		}
	}

	bucket, key := splitPath(path)
	if bucket == "" {
		return s3err(storageserr.ErrBucketNotFound)
	}

	if key == "" {
		return h.handleBucket(c, bucket, values, body)
	}
	return h.handleObject(c, bucket, key, values, body)
}

func splitPath(path string) (bucket, key string) {
	parts := strings.SplitN(path, "/", 2)
	bucket = parts[0]
	if len(parts) == 2 {
		key = parts[1]
	}
	return
}

func (h *S3Handler) assumeRole(c fiber.Ctx, body []byte) error {
	ak, sig, signed, region, dateScope, ok := h.svc.ParseAuthorization(c.Get("Authorization"))
	if !ok {
		return s3authErr(storageserr.ErrAccessDenied)
	}
	row, err := h.svc.Lookup(ak)
	if err != nil {
		return s3authErr(storageserr.ErrInvalidAccessKey)
	}
	if !h.svc.VerifySig(fiberHdr{c}, body, row.SecretKey, signed, dateScope, sig, region) {
		return s3authErr(storageserr.ErrSignatureMismatch)
	}
	sess, err := h.svc.IssueSession(row, 12*time.Hour)
	if err != nil {
		return err
	}
	var out assumeRoleResult
	out.XMLName.Local = "AssumeRoleResponse"
	out.Result.Credentials.AccessKeyId = sess.AccessKey
	out.Result.Credentials.SecretAccessKey = sess.SecretKey
	if sess.SessionToken != nil {
		out.Result.Credentials.SessionToken = *sess.SessionToken
	}
	if sess.ExpiresAt != nil {
		out.Result.Credentials.Expiration = sess.ExpiresAt.UTC().Format(time.RFC3339)
	}
	return xmlOut(c, 200, out)
}

func (h *S3Handler) listBuckets(c fiber.Ctx) error {
	var out listAllMyBuckets
	out.Owner.ID = "nfxstorages"
	out.Owner.DisplayName = "nfxstorages"
	for _, b := range h.svc.Objects.ListBuckets(h.callerAccount(c)) {
		out.Buckets.Bucket = append(out.Buckets.Bucket, struct {
			Name         string `xml:"Name"`
			CreationDate string `xml:"CreationDate"`
		}{Name: b.Name, CreationDate: b.Created.UTC().Format(time.RFC3339)})
	}
	return xmlOut(c, 200, out)
}

func (h *S3Handler) handleBucket(c fiber.Ctx, bucket string, q url.Values, body []byte) error {
	aid := h.callerAccount(c)
	switch c.Method() {
	case fiber.MethodPut:
		if q.Has("tagging") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Tags = parseTagXML(body) }))
		}
		if q.Has("versioning") {
			status := "Enabled"
			if strings.Contains(string(body), "Suspended") {
				status = "Suspended"
			}
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Versioning = status }))
		}
		if q.Has("policy") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Policy = string(body) }))
		}
		if q.Has("lifecycle") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Lifecycle = append([]byte{}, body...) }))
		}
		if q.Has("replication") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Replication = append([]byte{}, body...) }))
		}
		if q.Has("encryption") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Encryption = append([]byte{}, body...) }))
		}
		if q.Has("notification") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Notification = append([]byte{}, body...) }))
		}
		if q.Has("object-lock") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.ObjectLock = append([]byte{}, body...) }))
		}
		if err := h.svc.Objects.CreateBucket(bucket, aid); err != nil {
			return s3err(err)
		}
		return c.SendStatus(200)
	case fiber.MethodHead:
		if _, err := h.svc.Objects.GetBucket(bucket, aid); err != nil {
			return s3err(err)
		}
		return c.SendStatus(200)
	case fiber.MethodDelete:
		if q.Has("tagging") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Tags = nil }))
		}
		if q.Has("lifecycle") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Lifecycle = nil }))
		}
		if q.Has("encryption") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Encryption = nil }))
		}
		if q.Has("replication") {
			return s3err(h.svc.Objects.PutBucketMeta(bucket, aid, func(b *s3app.BucketInfo) { b.Replication = nil }))
		}
		if err := h.svc.Objects.DeleteBucket(bucket, aid); err != nil {
			return s3err(err)
		}
		return c.SendStatus(204)
	case fiber.MethodGet:
		info, err := h.svc.Objects.GetBucket(bucket, aid)
		if err != nil {
			return s3err(err)
		}
		if q.Has("tagging") {
			return xmlTags(c, info.Tags)
		}
		if q.Has("versioning") {
			return c.Type("xml").SendString(`<VersioningConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Status>` + info.Versioning + `</Status></VersioningConfiguration>`)
		}
		if q.Has("policy-status") {
			public := strings.Contains(info.Policy, `"Principal":"*"`) || strings.Contains(info.Policy, `"AWS":"*"`)
			flag := "false"
			if public {
				flag = "true"
			}
			return c.Type("xml").SendString(`<PolicyStatus xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><IsPublic>` + flag + `</IsPublic></PolicyStatus>`)
		}
		if q.Has("policy") {
			if info.Policy == "" {
				return s3err(storageserr.ErrNoSuchBucketPolicy)
			}
			return c.Type("json").SendString(info.Policy)
		}
		if q.Has("lifecycle") {
			if len(info.Lifecycle) == 0 {
				return s3err(storageserr.ErrNoSuchLifecycle)
			}
			return c.Type("xml").Send(info.Lifecycle)
		}
		if q.Has("encryption") {
			if len(info.Encryption) == 0 {
				return s3err(storageserr.ErrNoSuchEncryption)
			}
			return c.Type("xml").Send(info.Encryption)
		}
		if q.Has("replication") {
			if len(info.Replication) == 0 {
				return s3err(storageserr.ErrNoSuchReplication)
			}
			return c.Type("xml").Send(info.Replication)
		}
		if q.Has("notification") {
			if len(info.Notification) == 0 {
				return c.Type("xml").SendString(`<NotificationConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"/>`)
			}
			return c.Type("xml").Send(info.Notification)
		}
		if q.Has("object-lock") {
			if len(info.ObjectLock) == 0 {
				return s3err(storageserr.ErrNoSuchObjectLock)
			}
			return c.Type("xml").Send(info.ObjectLock)
		}
		if q.Has("versions") {
			return h.listObjectVersions(c, bucket, q, aid)
		}
		return h.listObjects(c, bucket, q, aid)
	}
	return s3err(storageserr.ErrMethodNotAllowed)
}

func (h *S3Handler) listObjects(c fiber.Ctx, bucket string, q url.Values, aid string) error {
	prefix := q.Get("prefix")
	maxKeys, _ := strconv.Atoi(q.Get("max-keys"))
	delim := q.Get("delimiter")
	marker := q.Get("continuation-token")
	if marker == "" {
		marker = q.Get("start-after")
	}
	if marker == "" {
		marker = q.Get("marker")
	}
	objs, next, truncated, err := h.svc.Objects.ListObjectsPage(bucket, prefix, marker, aid, maxKeys)
	if err != nil {
		return s3err(err)
	}
	out := listBucketResult{
		Name: bucket, Prefix: prefix, Delimiter: delim, MaxKeys: maxKeys,
		KeyCount: len(objs), IsTruncated: truncated, ContinuationToken: q.Get("continuation-token"),
		NextContinuationToken: next, StartAfter: q.Get("start-after"),
	}
	seenPrefix := map[string]bool{}
	for _, o := range objs {
		if delim != "" {
			rest := strings.TrimPrefix(o.Key, prefix)
			if i := strings.Index(rest, delim); i >= 0 {
				cp := prefix + rest[:i+len(delim)]
				if !seenPrefix[cp] {
					seenPrefix[cp] = true
					out.CommonPrefixes = append(out.CommonPrefixes, struct {
						Prefix string `xml:"Prefix"`
					}{Prefix: cp})
				}
				continue
			}
		}
		out.Contents = append(out.Contents, listContent{
			Key: o.Key, LastModified: o.LastModified.UTC().Format(time.RFC3339),
			ETag: s3app.FormatETag(o.ETag), Size: o.Size, StorageClass: "STANDARD",
		})
	}
	out.KeyCount = len(out.Contents) + len(out.CommonPrefixes)
	return xmlOut(c, 200, out)
}

func (h *S3Handler) listObjectVersions(c fiber.Ctx, bucket string, q url.Values, aid string) error {
	prefix := q.Get("prefix")
	maxKeys, _ := strconv.Atoi(q.Get("max-keys"))
	objs, _, _, err := h.svc.Objects.ListObjectsPage(bucket, prefix, q.Get("key-marker"), aid, maxKeys)
	if err != nil {
		return s3err(err)
	}
	var b strings.Builder
	b.WriteString(`<ListVersionsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">`)
	b.WriteString(`<Name>` + bucket + `</Name><Prefix>` + prefix + `</Prefix><IsTruncated>false</IsTruncated>`)
	for _, o := range objs {
		vid := o.VersionID
		if vid == "" {
			vid = o.ETag
			if vid == "" {
				vid = "null"
			}
		}
		b.WriteString(`<Version><Key>`)
		b.WriteString(o.Key)
		b.WriteString(`</Key><VersionId>`)
		b.WriteString(vid)
		b.WriteString(`</VersionId><IsLatest>true</IsLatest><LastModified>`)
		b.WriteString(o.LastModified.UTC().Format(time.RFC3339))
		b.WriteString(`</LastModified><ETag>`)
		b.WriteString(s3app.FormatETag(o.ETag))
		b.WriteString(`</ETag><Size>`)
		b.WriteString(strconv.FormatInt(o.Size, 10))
		b.WriteString(`</Size><StorageClass>STANDARD</StorageClass></Version>`)
	}
	b.WriteString(`</ListVersionsResult>`)
	return c.Type("xml").SendString(b.String())
}

func (h *S3Handler) handleObject(c fiber.Ctx, bucket, key string, q url.Values, body []byte) error {
	key, _ = url.PathUnescape(key)
	aid := h.callerAccount(c)
	switch c.Method() {
	case fiber.MethodPut:
		if q.Has("tagging") {
			return s3err(h.svc.Objects.UpdateObjectMeta(bucket, key, aid, func(o *s3app.ObjectInfo) { o.Tags = parseTagXML(body) }))
		}
		if q.Has("retention") {
			return s3err(h.svc.Objects.UpdateObjectMeta(bucket, key, aid, func(o *s3app.ObjectInfo) {
				o.Retention = map[string]any{"raw": string(body)}
			}))
		}
		if q.Has("legal-hold") {
			status := "OFF"
			if strings.Contains(string(body), "ON") {
				status = "ON"
			}
			return s3err(h.svc.Objects.UpdateObjectMeta(bucket, key, aid, func(o *s3app.ObjectInfo) { o.LegalHold = status }))
		}
		if q.Get("uploadId") != "" && q.Get("partNumber") != "" {
			if _, err := h.svc.Objects.GetBucket(bucket, aid); err != nil {
				return s3err(err)
			}
			return h.uploadPart(c, bucket, key, q.Get("uploadId"), q.Get("partNumber"), body)
		}
		ct := c.Get("Content-Type")
		info, err := h.svc.Objects.PutObject(bucket, key, ct, body, aid)
		if err != nil {
			return s3err(err)
		}
		c.Set("ETag", s3app.FormatETag(info.ETag))
		return c.SendStatus(200)
	case fiber.MethodGet:
		if q.Has("tagging") {
			info, err := h.svc.Objects.HeadObject(bucket, key, aid)
			if err != nil {
				return s3err(err)
			}
			return xmlTags(c, info.Tags)
		}
		if q.Has("retention") {
			info, err := h.svc.Objects.HeadObject(bucket, key, aid)
			if err != nil {
				return s3err(err)
			}
			mode := "GOVERNANCE"
			until := ""
			if info.Retention != nil {
				if v, ok := info.Retention["mode"].(string); ok {
					mode = v
				}
				if v, ok := info.Retention["until"].(string); ok {
					until = v
				}
			}
			return c.Type("xml").SendString(`<Retention><Mode>` + mode + `</Mode><RetainUntilDate>` + until + `</RetainUntilDate></Retention>`)
		}
		if q.Has("legal-hold") {
			info, err := h.svc.Objects.HeadObject(bucket, key, aid)
			if err != nil {
				return s3err(err)
			}
			st := info.LegalHold
			if st == "" {
				st = "OFF"
			}
			return c.Type("xml").SendString(`<LegalHold><Status>` + st + `</Status></LegalHold>`)
		}
		info, data, err := h.svc.Objects.GetObject(bucket, key, aid)
		if err != nil {
			if errors.Is(err, store.ErrForbidden) {
				return s3err(err)
			}
			return s3err(storageserr.ErrObjectNotFound)
		}
		c.Set("ETag", s3app.FormatETag(info.ETag))
		c.Set("Last-Modified", info.LastModified.UTC().Format(httpDate))
		if info.ContentType != "" {
			c.Set("Content-Type", info.ContentType)
		}
		return c.Send(data)
	case fiber.MethodHead:
		info, err := h.svc.Objects.HeadObject(bucket, key, aid)
		if err != nil {
			if errors.Is(err, store.ErrForbidden) {
				return s3err(err)
			}
			return s3err(storageserr.ErrObjectNotFound)
		}
		c.Set("ETag", s3app.FormatETag(info.ETag))
		c.Set("Content-Length", strconv.FormatInt(info.Size, 10))
		c.Set("Last-Modified", info.LastModified.UTC().Format(httpDate))
		if info.ContentType != "" {
			c.Set("Content-Type", info.ContentType)
		}
		return c.SendStatus(200)
	case fiber.MethodDelete:
		if q.Has("tagging") {
			return s3err(h.svc.Objects.UpdateObjectMeta(bucket, key, aid, func(o *s3app.ObjectInfo) { o.Tags = map[string]string{} }))
		}
		if q.Get("uploadId") != "" {
			if _, err := h.svc.Objects.GetBucket(bucket, aid); err != nil {
				return s3err(err)
			}
			_ = os.RemoveAll(h.mpDir(q.Get("uploadId")))
			return c.SendStatus(204)
		}
		if err := h.svc.Objects.DeleteObject(bucket, key, aid); err != nil {
			if errors.Is(err, store.ErrForbidden) {
				return s3err(err)
			}
			return s3err(storageserr.ErrObjectNotFound)
		}
		return c.SendStatus(204)
	case fiber.MethodPost:
		if _, err := h.svc.Objects.GetBucket(bucket, aid); err != nil {
			return s3err(err)
		}
		if q.Has("uploads") {
			id := uuid.NewString()
			_ = os.MkdirAll(h.mpDir(id), 0o755)
			return xmlOut(c, 200, initiateMultipart{Bucket: bucket, Key: key, UploadID: id})
		}
		if q.Get("uploadId") != "" {
			return h.completeMultipart(c, bucket, key, q.Get("uploadId"), aid)
		}
	}
	return s3err(storageserr.ErrMethodNotAllowed)
}

const httpDate = "Mon, 02 Jan 2006 15:04:05 GMT"

func (h *S3Handler) mpDir(id string) string {
	disks := h.svc.Objects.Disks()
	root := "./data/disk0"
	if len(disks) > 0 {
		root = disks[0]
	}
	return filepath.Join(root, ".multipart", id)
}

func (h *S3Handler) uploadPart(c fiber.Ctx, bucket, key, uploadID, partNumber string, body []byte) error {
	dir := h.mpDir(uploadID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(dir, "part-"+partNumber), body, 0o644); err != nil {
		return err
	}
	sum := s3app.HashSHA256(body)
	c.Set("ETag", s3app.FormatETag(sum[:32]))
	return c.SendStatus(200)
}

func (h *S3Handler) completeMultipart(c fiber.Ctx, bucket, key, uploadID, aid string) error {
	dir := h.mpDir(uploadID)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return s3err(storageserr.ErrNoSuchUpload)
	}
	var buf []byte
	for i := 1; i <= len(entries)+8; i++ {
		p := filepath.Join(dir, "part-"+strconv.Itoa(i))
		b, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		buf = append(buf, b...)
	}
	info, err := h.svc.Objects.PutObject(bucket, key, c.Get("Content-Type"), buf, aid)
	if err != nil {
		return s3err(err)
	}
	_ = os.RemoveAll(dir)
	return xmlOut(c, 200, completeMultipart{
		Location: "/" + bucket + "/" + key, Bucket: bucket, Key: key, ETag: s3app.FormatETag(info.ETag),
	})
}

func parseTagXML(body []byte) map[string]string {
	out := map[string]string{}
	type tag struct {
		Key   string `xml:"Key"`
		Value string `xml:"Value"`
	}
	var doc struct {
		Tags []tag `xml:"TagSet>Tag"`
	}
	_ = xml.Unmarshal(body, &doc)
	for _, t := range doc.Tags {
		if t.Key != "" {
			out[t.Key] = t.Value
		}
	}
	return out
}

func xmlTags(c fiber.Ctx, tags map[string]string) error {
	var b strings.Builder
	b.WriteString(`<Tagging><TagSet>`)
	for k, v := range tags {
		b.WriteString(`<Tag><Key>`)
		b.WriteString(k)
		b.WriteString(`</Key><Value>`)
		b.WriteString(v)
		b.WriteString(`</Value></Tag>`)
	}
	b.WriteString(`</TagSet></Tagging>`)
	return c.Type("xml").SendString(b.String())
}
