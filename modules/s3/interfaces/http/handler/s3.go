package handler

import (
	"encoding/xml"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"nfxstorages/engine/iam"
	"nfxstorages/engine/sigv4"
	"nfxstorages/engine/store"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type S3Handler struct {
	store *store.Engine
	iam   *iam.Service
}

func NewS3Handler(st *store.Engine, keys *iam.Service) *S3Handler {
	return &S3Handler{store: st, iam: keys}
}

type fiberHdr struct{ c fiber.Ctx }

func (h fiberHdr) Get(key string) string { return h.c.Get(key) }
func (h fiberHdr) Host() string          { return h.c.Get("Host") }
func (h fiberHdr) Method() string        { return h.c.Method() }
func (h fiberHdr) Path() string          { return h.c.Path() }
func (h fiberHdr) Query() string         { return string(h.c.Request().URI().QueryString()) }

func (h *S3Handler) authorize(c fiber.Ctx, body []byte) error {
	authz := c.Get("Authorization")
	ak, sig, signed, region, dateScope, ok := sigv4.ParseAuthorization(authz)
	if !ok {
		return fiber.NewError(fiber.StatusForbidden, "AccessDenied")
	}
	row, err := h.iam.Lookup(ak)
	if err != nil {
		return fiber.NewError(fiber.StatusForbidden, "InvalidAccessKeyId")
	}
	if !sigv4.Verify(fiberHdr{c}, body, row.SecretKey, signed, dateScope, sig, region) {
		return fiber.NewError(fiber.StatusForbidden, "SignatureDoesNotMatch")
	}
	if !h.iam.MatchSession(row, c.Get("X-Amz-Security-Token")) {
		return fiber.NewError(fiber.StatusForbidden, "InvalidToken")
	}
	c.Locals("access_key", ak)
	return nil
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
		return fiber.NewError(404, "NoSuchBucket")
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
	authz := c.Get("Authorization")
	ak, sig, signed, region, dateScope, ok := sigv4.ParseAuthorization(authz)
	if !ok {
		return fiber.NewError(403, "AccessDenied")
	}
	row, err := h.iam.Lookup(ak)
	if err != nil {
		return fiber.NewError(403, "InvalidAccessKeyId")
	}
	if !sigv4.Verify(fiberHdr{c}, body, row.SecretKey, signed, dateScope, sig, region) {
		return fiber.NewError(403, "SignatureDoesNotMatch")
	}
	sess, err := h.iam.IssueSession(row, 12*time.Hour)
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
	for _, b := range h.store.ListBuckets() {
		out.Buckets.Bucket = append(out.Buckets.Bucket, struct {
			Name         string `xml:"Name"`
			CreationDate string `xml:"CreationDate"`
		}{Name: b.Name, CreationDate: b.Created.UTC().Format(time.RFC3339)})
	}
	return xmlOut(c, 200, out)
}

func (h *S3Handler) handleBucket(c fiber.Ctx, bucket string, q url.Values, body []byte) error {
	switch c.Method() {
	case fiber.MethodPut:
		if q.Has("tagging") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Tags = parseTagXML(body) })
		}
		if q.Has("versioning") {
			status := "Enabled"
			if strings.Contains(string(body), "Suspended") {
				status = "Suspended"
			}
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Versioning = status })
		}
		if q.Has("policy") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Policy = string(body) })
		}
		if q.Has("lifecycle") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Lifecycle = append([]byte{}, body...) })
		}
		if q.Has("replication") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Replication = append([]byte{}, body...) })
		}
		if q.Has("encryption") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Encryption = append([]byte{}, body...) })
		}
		if q.Has("notification") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Notification = append([]byte{}, body...) })
		}
		if q.Has("object-lock") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.ObjectLock = append([]byte{}, body...) })
		}
		if err := h.store.CreateBucket(bucket); err != nil {
			return fiber.NewError(409, err.Error())
		}
		return c.SendStatus(200)
	case fiber.MethodHead:
		if _, err := h.store.GetBucket(bucket); err != nil {
			return fiber.NewError(404, "NoSuchBucket")
		}
		return c.SendStatus(200)
	case fiber.MethodDelete:
		if q.Has("tagging") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Tags = nil })
		}
		if q.Has("lifecycle") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Lifecycle = nil })
		}
		if q.Has("encryption") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Encryption = nil })
		}
		if q.Has("replication") {
			return h.store.PutBucketMeta(bucket, func(b *store.BucketInfo) { b.Replication = nil })
		}
		if err := h.store.DeleteBucket(bucket); err != nil {
			return fiber.NewError(409, err.Error())
		}
		return c.SendStatus(204)
	case fiber.MethodGet:
		info, err := h.store.GetBucket(bucket)
		if err != nil {
			return fiber.NewError(404, "NoSuchBucket")
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
				return fiber.NewError(404, "NoSuchBucketPolicy")
			}
			return c.Type("json").SendString(info.Policy)
		}
		if q.Has("lifecycle") {
			if len(info.Lifecycle) == 0 {
				return fiber.NewError(404, "NoSuchLifecycleConfiguration")
			}
			return c.Type("xml").Send(info.Lifecycle)
		}
		if q.Has("encryption") {
			if len(info.Encryption) == 0 {
				return fiber.NewError(404, "ServerSideEncryptionConfigurationNotFoundError")
			}
			return c.Type("xml").Send(info.Encryption)
		}
		if q.Has("replication") {
			if len(info.Replication) == 0 {
				return fiber.NewError(404, "ReplicationConfigurationNotFoundError")
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
				return fiber.NewError(404, "ObjectLockConfigurationNotFoundError")
			}
			return c.Type("xml").Send(info.ObjectLock)
		}
		if q.Has("versions") {
			return h.listObjectVersions(c, bucket, q)
		}
		return h.listObjects(c, bucket, q)
	}
	return fiber.NewError(405, "MethodNotAllowed")
}

func (h *S3Handler) listObjects(c fiber.Ctx, bucket string, q url.Values) error {
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
	objs, next, truncated, err := h.store.ListObjectsPage(bucket, prefix, marker, maxKeys)
	if err != nil {
		return err
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
			ETag: store.FormatETag(o.ETag), Size: o.Size, StorageClass: "STANDARD",
		})
	}
	out.KeyCount = len(out.Contents) + len(out.CommonPrefixes)
	return xmlOut(c, 200, out)
}

func (h *S3Handler) listObjectVersions(c fiber.Ctx, bucket string, q url.Values) error {
	prefix := q.Get("prefix")
	maxKeys, _ := strconv.Atoi(q.Get("max-keys"))
	objs, _, _, err := h.store.ListObjectsPage(bucket, prefix, q.Get("key-marker"), maxKeys)
	if err != nil {
		return err
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
		b.WriteString(store.FormatETag(o.ETag))
		b.WriteString(`</ETag><Size>`)
		b.WriteString(strconv.FormatInt(o.Size, 10))
		b.WriteString(`</Size><StorageClass>STANDARD</StorageClass></Version>`)
	}
	b.WriteString(`</ListVersionsResult>`)
	return c.Type("xml").SendString(b.String())
}

func (h *S3Handler) handleObject(c fiber.Ctx, bucket, key string, q url.Values, body []byte) error {
	key, _ = url.PathUnescape(key)
	switch c.Method() {
	case fiber.MethodPut:
		if q.Has("tagging") {
			return h.store.UpdateObjectMeta(bucket, key, func(o *store.ObjectInfo) { o.Tags = parseTagXML(body) })
		}
		if q.Has("retention") {
			return h.store.UpdateObjectMeta(bucket, key, func(o *store.ObjectInfo) {
				o.Retention = map[string]any{"raw": string(body)}
			})
		}
		if q.Has("legal-hold") {
			status := "OFF"
			if strings.Contains(string(body), "ON") {
				status = "ON"
			}
			return h.store.UpdateObjectMeta(bucket, key, func(o *store.ObjectInfo) { o.LegalHold = status })
		}
		if q.Get("uploadId") != "" && q.Get("partNumber") != "" {
			return h.uploadPart(c, bucket, key, q.Get("uploadId"), q.Get("partNumber"), body)
		}
		ct := c.Get("Content-Type")
		info, err := h.store.PutObject(bucket, key, ct, body)
		if err != nil {
			return err
		}
		c.Set("ETag", store.FormatETag(info.ETag))
		return c.SendStatus(200)
	case fiber.MethodGet:
		if q.Has("tagging") {
			info, err := h.store.HeadObject(bucket, key)
			if err != nil {
				return fiber.NewError(404, "NoSuchKey")
			}
			return xmlTags(c, info.Tags)
		}
		if q.Has("retention") {
			info, err := h.store.HeadObject(bucket, key)
			if err != nil {
				return fiber.NewError(404, "NoSuchKey")
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
			info, err := h.store.HeadObject(bucket, key)
			if err != nil {
				return fiber.NewError(404, "NoSuchKey")
			}
			st := info.LegalHold
			if st == "" {
				st = "OFF"
			}
			return c.Type("xml").SendString(`<LegalHold><Status>` + st + `</Status></LegalHold>`)
		}
		info, data, err := h.store.GetObject(bucket, key)
		if err != nil {
			return fiber.NewError(404, "NoSuchKey")
		}
		c.Set("ETag", store.FormatETag(info.ETag))
		c.Set("Last-Modified", info.LastModified.UTC().Format(httpDate))
		if info.ContentType != "" {
			c.Set("Content-Type", info.ContentType)
		}
		return c.Send(data)
	case fiber.MethodHead:
		info, err := h.store.HeadObject(bucket, key)
		if err != nil {
			return fiber.NewError(404, "NoSuchKey")
		}
		c.Set("ETag", store.FormatETag(info.ETag))
		c.Set("Content-Length", strconv.FormatInt(info.Size, 10))
		c.Set("Last-Modified", info.LastModified.UTC().Format(httpDate))
		if info.ContentType != "" {
			c.Set("Content-Type", info.ContentType)
		}
		return c.SendStatus(200)
	case fiber.MethodDelete:
		if q.Has("tagging") {
			return h.store.UpdateObjectMeta(bucket, key, func(o *store.ObjectInfo) { o.Tags = map[string]string{} })
		}
		if q.Get("uploadId") != "" {
			_ = os.RemoveAll(h.mpDir(q.Get("uploadId")))
			return c.SendStatus(204)
		}
		if err := h.store.DeleteObject(bucket, key); err != nil {
			return fiber.NewError(404, "NoSuchKey")
		}
		return c.SendStatus(204)
	case fiber.MethodPost:
		if q.Has("uploads") {
			id := uuid.NewString()
			_ = os.MkdirAll(h.mpDir(id), 0o755)
			return xmlOut(c, 200, initiateMultipart{Bucket: bucket, Key: key, UploadID: id})
		}
		if q.Get("uploadId") != "" {
			return h.completeMultipart(c, bucket, key, q.Get("uploadId"))
		}
	}
	return fiber.NewError(405, "MethodNotAllowed")
}

const httpDate = "Mon, 02 Jan 2006 15:04:05 GMT"

func (h *S3Handler) mpDir(id string) string {
	disks := h.store.Disks()
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
	sum := sigv4.HashSHA256(body)
	c.Set("ETag", store.FormatETag(sum[:32]))
	return c.SendStatus(200)
}

func (h *S3Handler) completeMultipart(c fiber.Ctx, bucket, key, uploadID string) error {
	dir := h.mpDir(uploadID)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fiber.NewError(404, "NoSuchUpload")
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
	info, err := h.store.PutObject(bucket, key, c.Get("Content-Type"), buf)
	if err != nil {
		return err
	}
	_ = os.RemoveAll(dir)
	return xmlOut(c, 200, completeMultipart{
		Location: "/" + bucket + "/" + key, Bucket: bucket, Key: key, ETag: store.FormatETag(info.ETag),
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
