package objectapp

import "nfxstorages/engine/store"

type Service struct{ engine *store.Engine }

func New(engine *store.Engine) *Service { return &Service{engine: engine} }

type Engine = store.Engine
type BucketInfo = store.BucketInfo
type ObjectInfo = store.ObjectInfo

func (s *Service) Engine() *store.Engine { return s.engine }
func (s *Service) Disks() []string       { return s.engine.Disks() }
func (s *Service) Usage(accountID string) (int, int, int64) {
	return s.engine.Usage(accountID)
}
func (s *Service) ListBuckets(accountID string) []store.BucketInfo {
	return s.engine.ListBuckets(accountID)
}
func (s *Service) CreateBucket(name, accountID string) error {
	return s.engine.CreateBucket(name, accountID)
}
func (s *Service) GetBucket(name, accountID string) (store.BucketInfo, error) {
	return s.engine.GetBucket(name, accountID)
}
func (s *Service) DeleteBucket(name, accountID string) error {
	return s.engine.DeleteBucket(name, accountID)
}
func (s *Service) PutBucketMeta(name, accountID string, fn func(*store.BucketInfo)) error {
	return s.engine.PutBucketMeta(name, accountID, fn)
}
func (s *Service) ListObjectsPage(bucket, prefix, marker, accountID string, maxKeys int) ([]store.ObjectInfo, string, bool, error) {
	return s.engine.ListObjectsPage(bucket, prefix, marker, accountID, maxKeys)
}
func (s *Service) PutObject(bucket, key, contentType string, body []byte, accountID string) (store.ObjectInfo, error) {
	return s.engine.PutObject(bucket, key, contentType, body, accountID)
}
func (s *Service) HeadObject(bucket, key, accountID string) (store.ObjectInfo, error) {
	return s.engine.HeadObject(bucket, key, accountID)
}
func (s *Service) GetObject(bucket, key, accountID string) (store.ObjectInfo, []byte, error) {
	return s.engine.GetObject(bucket, key, accountID)
}
func (s *Service) DeleteObject(bucket, key, accountID string) error {
	return s.engine.DeleteObject(bucket, key, accountID)
}
func (s *Service) UpdateObjectMeta(bucket, key, accountID string, fn func(*store.ObjectInfo)) error {
	return s.engine.UpdateObjectMeta(bucket, key, accountID, fn)
}
func (s *Service) DiskStats(path string) map[string]any {
	return store.DiskStats(path)
}
