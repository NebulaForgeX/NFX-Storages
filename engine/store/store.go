package store

import (
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	storageserr "nfxstorages/errors/src/storages"

	"github.com/klauspost/reedsolomon"
)

var (
	ErrNotFound       = storageserr.ErrNotFound
	ErrForbidden      = storageserr.ErrForbidden
	ErrBucketExists   = storageserr.ErrBucketExists
	ErrBucketNotEmpty = storageserr.ErrBucketNotEmpty
)

type ObjectInfo struct {
	Key          string            `json:"key"`
	ETag         string            `json:"etag"`
	Size         int64             `json:"size"`
	ContentType  string            `json:"content_type"`
	LastModified time.Time         `json:"last_modified"`
	VersionID    string            `json:"version_id,omitempty"`
	Tags         map[string]string `json:"tags,omitempty"`
	Retention    map[string]any    `json:"retention,omitempty"`
	LegalHold    string            `json:"legal_hold,omitempty"`
}

type BucketInfo struct {
	Name         string            `json:"name"`
	AccountID    string            `json:"account_id,omitempty"`
	Created      time.Time         `json:"created"`
	Tags         map[string]string `json:"tags,omitempty"`
	Versioning   string            `json:"versioning,omitempty"`
	Policy       string            `json:"policy,omitempty"`
	Lifecycle    json.RawMessage   `json:"lifecycle,omitempty"`
	Replication  json.RawMessage   `json:"replication,omitempty"`
	Encryption   json.RawMessage   `json:"encryption,omitempty"`
	Notification json.RawMessage   `json:"notification,omitempty"`
	ObjectLock   json.RawMessage   `json:"object_lock,omitempty"`
}

type Engine struct {
	mu           sync.RWMutex
	disks        []string
	dataShards   int
	parityShards int
	enc          reedsolomon.Encoder
}

func New(disks []string, dataShards, parityShards int) (*Engine, error) {
	if len(disks) == 0 {
		return nil, storageserr.ErrVolumeMissing
	}
	if dataShards <= 0 {
		dataShards = 1
	}
	if parityShards < 0 {
		parityShards = 0
	}
	total := dataShards + parityShards
	if total > len(disks) {
		dataShards = len(disks)
		parityShards = 0
		total = dataShards
	}
	var enc reedsolomon.Encoder
	var err error
	if parityShards > 0 {
		enc, err = reedsolomon.New(dataShards, parityShards)
		if err != nil {
			return nil, err
		}
	}
	for _, d := range disks {
		if err := os.MkdirAll(filepath.Join(d, "buckets"), 0o755); err != nil {
			return nil, err
		}
		if err := os.MkdirAll(filepath.Join(d, "objects"), 0o755); err != nil {
			return nil, err
		}
	}
	return &Engine{disks: disks, dataShards: dataShards, parityShards: parityShards, enc: enc}, nil
}

func (e *Engine) Disks() []string { return append([]string{}, e.disks...) }

func (e *Engine) bucketMetaPath(disk, bucket string) string {
	return filepath.Join(disk, "buckets", bucket, "xl.meta")
}

func (e *Engine) objectDir(disk, bucket, key string) string {
	sum := sha256.Sum256([]byte(key))
	return filepath.Join(disk, "objects", bucket, hex.EncodeToString(sum[:]))
}

func (e *Engine) assertOwnedLocked(name, accountID string) (BucketInfo, error) {
	info, err := e.getBucketLocked(name)
	if err != nil {
		return BucketInfo{}, err
	}
	if accountID == "" || info.AccountID == "" || info.AccountID != accountID {
		return BucketInfo{}, ErrForbidden
	}
	return info, nil
}

func (e *Engine) CreateBucket(name, accountID string) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if accountID == "" {
		return ErrForbidden
	}
	if _, err := e.getBucketLocked(name); err == nil {
		return ErrBucketExists
	}
	info := BucketInfo{Name: name, AccountID: accountID, Created: time.Now().UTC()}
	return e.writeBucketLocked(info)
}

func (e *Engine) writeBucketLocked(info BucketInfo) error {
	raw, _ := json.Marshal(info)
	for _, d := range e.disks {
		dir := filepath.Join(d, "buckets", info.Name)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(dir, "xl.meta"), raw, 0o644); err != nil {
			return err
		}
	}
	return nil
}

func (e *Engine) getBucketLocked(name string) (BucketInfo, error) {
	for _, d := range e.disks {
		b, err := os.ReadFile(e.bucketMetaPath(d, name))
		if err != nil {
			continue
		}
		var info BucketInfo
		if err := json.Unmarshal(b, &info); err != nil {
			continue
		}
		return info, nil
	}
	return BucketInfo{}, ErrNotFound
}

func (e *Engine) GetBucket(name, accountID string) (BucketInfo, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.assertOwnedLocked(name, accountID)
}

func (e *Engine) DeleteBucket(name, accountID string) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if _, err := e.assertOwnedLocked(name, accountID); err != nil {
		return err
	}
	objs, _ := e.listObjectsLocked(name, "", 1)
	if len(objs) > 0 {
		return ErrBucketNotEmpty
	}
	for _, d := range e.disks {
		_ = os.RemoveAll(filepath.Join(d, "buckets", name))
		_ = os.RemoveAll(filepath.Join(d, "objects", name))
	}
	return nil
}

func (e *Engine) ListBuckets(accountID string) []BucketInfo {
	e.mu.RLock()
	defer e.mu.RUnlock()
	if accountID == "" {
		return nil
	}
	seen := map[string]BucketInfo{}
	for _, d := range e.disks {
		entries, err := os.ReadDir(filepath.Join(d, "buckets"))
		if err != nil {
			continue
		}
		for _, ent := range entries {
			if !ent.IsDir() {
				continue
			}
			info, err := e.getBucketLocked(ent.Name())
			if err != nil || info.AccountID != accountID {
				continue
			}
			seen[ent.Name()] = info
		}
	}
	out := make([]BucketInfo, 0, len(seen))
	for _, v := range seen {
		out = append(out, v)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func (e *Engine) PutBucketMeta(name, accountID string, mutate func(*BucketInfo)) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	info, err := e.assertOwnedLocked(name, accountID)
	if err != nil {
		return err
	}
	owner, bname := info.AccountID, info.Name
	mutate(&info)
	info.AccountID = owner
	info.Name = bname
	return e.writeBucketLocked(info)
}

func (e *Engine) PutObject(bucket, key, contentType string, body []byte, accountID string) (ObjectInfo, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if _, err := e.assertOwnedLocked(bucket, accountID); err != nil {
		return ObjectInfo{}, err
	}
	sum := md5.Sum(body)
	info := ObjectInfo{
		Key: key, ETag: hex.EncodeToString(sum[:]), Size: int64(len(body)),
		ContentType: contentType, LastModified: time.Now().UTC(), Tags: map[string]string{},
	}
	meta, _ := json.Marshal(info)
	shards, err := e.split(body)
	if err != nil {
		return ObjectInfo{}, err
	}
	for i, d := range e.disks {
		dir := e.objectDir(d, bucket, key)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return ObjectInfo{}, err
		}
		if err := os.WriteFile(filepath.Join(dir, "xl.meta"), meta, 0o644); err != nil {
			return ObjectInfo{}, err
		}
		part := []byte{}
		if i < len(shards) {
			part = shards[i]
		}
		if err := os.WriteFile(filepath.Join(dir, "part.0"), part, 0o644); err != nil {
			return ObjectInfo{}, err
		}
	}
	return info, nil
}

func (e *Engine) split(body []byte) ([][]byte, error) {
	if e.enc == nil || e.parityShards == 0 {
		out := make([][]byte, len(e.disks))
		out[0] = body
		return out, nil
	}
	shards, err := e.enc.Split(body)
	if err != nil {
		return nil, err
	}
	if err := e.enc.Encode(shards); err != nil {
		return nil, err
	}
	return shards, nil
}

func (e *Engine) GetObject(bucket, key, accountID string) (ObjectInfo, []byte, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	if _, err := e.assertOwnedLocked(bucket, accountID); err != nil {
		return ObjectInfo{}, nil, err
	}
	info, shards, err := e.readShardsLocked(bucket, key)
	if err != nil {
		return ObjectInfo{}, nil, err
	}
	body, err := e.join(shards, info.Size)
	if err != nil {
		return ObjectInfo{}, nil, err
	}
	return info, body, nil
}

func (e *Engine) HeadObject(bucket, key, accountID string) (ObjectInfo, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	if _, err := e.assertOwnedLocked(bucket, accountID); err != nil {
		return ObjectInfo{}, err
	}
	info, _, err := e.readShardsLocked(bucket, key)
	return info, err
}

func (e *Engine) readShardsLocked(bucket, key string) (ObjectInfo, [][]byte, error) {
	var info ObjectInfo
	shards := make([][]byte, len(e.disks))
	found := false
	for i, d := range e.disks {
		dir := e.objectDir(d, bucket, key)
		meta, err := os.ReadFile(filepath.Join(dir, "xl.meta"))
		if err != nil {
			continue
		}
		if err := json.Unmarshal(meta, &info); err != nil {
			continue
		}
		part, err := os.ReadFile(filepath.Join(dir, "part.0"))
		if err != nil {
			continue
		}
		shards[i] = part
		found = true
	}
	if !found {
		return ObjectInfo{}, nil, ErrNotFound
	}
	return info, shards, nil
}

func (e *Engine) join(shards [][]byte, size int64) ([]byte, error) {
	if e.enc == nil || e.parityShards == 0 {
		for _, s := range shards {
			if len(s) > 0 {
				if int64(len(s)) > size && size >= 0 {
					return s[:size], nil
				}
				return s, nil
			}
		}
		return nil, ErrNotFound
	}
	ok := make([][]byte, e.dataShards+e.parityShards)
	copy(ok, shards)
	if err := e.enc.Reconstruct(ok); err != nil {
		return nil, err
	}
	var buf []byte
	for i := 0; i < e.dataShards; i++ {
		buf = append(buf, ok[i]...)
	}
	if size >= 0 && int64(len(buf)) > size {
		buf = buf[:size]
	}
	return buf, nil
}

func (e *Engine) DeleteObject(bucket, key, accountID string) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if _, err := e.assertOwnedLocked(bucket, accountID); err != nil {
		return err
	}
	deleted := false
	for _, d := range e.disks {
		dir := e.objectDir(d, bucket, key)
		if err := os.RemoveAll(dir); err == nil {
			deleted = true
		}
	}
	if !deleted {
		return ErrNotFound
	}
	return nil
}

func (e *Engine) UpdateObjectMeta(bucket, key, accountID string, mutate func(*ObjectInfo)) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if _, err := e.assertOwnedLocked(bucket, accountID); err != nil {
		return err
	}
	info, _, err := e.readShardsLocked(bucket, key)
	if err != nil {
		return err
	}
	mutate(&info)
	raw, _ := json.Marshal(info)
	for _, d := range e.disks {
		dir := e.objectDir(d, bucket, key)
		_ = os.WriteFile(filepath.Join(dir, "xl.meta"), raw, 0o644)
	}
	return nil
}

func (e *Engine) ListObjects(bucket, prefix, accountID string, maxKeys int) ([]ObjectInfo, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	if _, err := e.assertOwnedLocked(bucket, accountID); err != nil {
		return nil, err
	}
	return e.listObjectsLocked(bucket, prefix, maxKeys)
}

func (e *Engine) ListObjectsPage(bucket, prefix, marker, accountID string, maxKeys int) (objs []ObjectInfo, next string, truncated bool, err error) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	if _, err := e.assertOwnedLocked(bucket, accountID); err != nil {
		return nil, "", false, err
	}
	all, err := e.listObjectsLocked(bucket, prefix, 0)
	if err != nil {
		return nil, "", false, err
	}
	if maxKeys <= 0 {
		maxKeys = 1000
	}
	start := 0
	if marker != "" {
		for i, o := range all {
			if o.Key > marker || o.Key == marker {
				if o.Key == marker {
					start = i + 1
				} else {
					start = i
				}
				break
			}
			start = i + 1
		}
	}
	if start >= len(all) {
		return nil, "", false, nil
	}
	end := start + maxKeys
	if end < len(all) {
		return all[start:end], all[end-1].Key, true, nil
	}
	return all[start:], "", false, nil
}

func (e *Engine) listObjectsLocked(bucket, prefix string, maxKeys int) ([]ObjectInfo, error) {
	unlimited := maxKeys <= 0
	if !unlimited && maxKeys <= 0 {
		maxKeys = 1000
	}
	seen := map[string]ObjectInfo{}
	for _, d := range e.disks {
		root := filepath.Join(d, "objects", bucket)
		_ = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
			if err != nil || info == nil || info.IsDir() || info.Name() != "xl.meta" {
				return nil
			}
			b, err := os.ReadFile(path)
			if err != nil {
				return nil
			}
			var obj ObjectInfo
			if json.Unmarshal(b, &obj) != nil {
				return nil
			}
			if prefix == "" || strings.HasPrefix(obj.Key, prefix) {
				seen[obj.Key] = obj
			}
			return nil
		})
	}
	keys := make([]string, 0, len(seen))
	for k := range seen {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	out := make([]ObjectInfo, 0, len(keys))
	for _, k := range keys {
		out = append(out, seen[k])
		if !unlimited && len(out) >= maxKeys {
			break
		}
	}
	return out, nil
}

func (e *Engine) Usage(accountID string) (buckets int, objects int, bytes int64) {
	bs := e.ListBuckets(accountID)
	buckets = len(bs)
	e.mu.RLock()
	defer e.mu.RUnlock()
	for _, b := range bs {
		objs, _ := e.listObjectsLocked(b.Name, "", 100000)
		objects += len(objs)
		for _, o := range objs {
			bytes += o.Size
		}
	}
	return
}

func HashKey(s string) string {
	sum := sha256.Sum256([]byte(s))
	return hex.EncodeToString(sum[:])
}

func ReadAll(r io.Reader) ([]byte, error) { return io.ReadAll(r) }

func MustAbs(p string) string {
	a, err := filepath.Abs(p)
	if err != nil {
		return p
	}
	return a
}

func DiskStats(path string) map[string]any {
	var total, free uint64
	_ = total
	_ = free
	fi, err := os.Stat(path)
	return map[string]any{"path": path, "exists": err == nil, "dir": fi != nil && fi.IsDir()}
}

func FormatETag(etag string) string {
	if etag == "" {
		return `""`
	}
	if strings.HasPrefix(etag, `"`) {
		return etag
	}
	return fmt.Sprintf(`"%s"`, etag)
}
