package objectapp

import "nfxstorages/engine/store"

type Service struct{ engine *store.Engine }

func New(engine *store.Engine) *Service { return &Service{engine: engine} }

type Engine = store.Engine
type BucketInfo = store.BucketInfo
type ObjectInfo = store.ObjectInfo

func (s *Service) Engine() *store.Engine { return s.engine }
func (s *Service) Disks() []string       { return s.engine.Disks() }
func (s *Service) Usage() (int, int, int64) {
	return s.engine.Usage()
}
func (s *Service) ListBuckets() []store.BucketInfo { return s.engine.ListBuckets() }
func (s *Service) CreateBucket(name string) error  { return s.engine.CreateBucket(name) }
func (s *Service) GetBucket(name string) (store.BucketInfo, error) {
	return s.engine.GetBucket(name)
}
func (s *Service) DeleteBucket(name string) error { return s.engine.DeleteBucket(name) }
func (s *Service) PutBucketMeta(name string, fn func(*store.BucketInfo)) error {
	return s.engine.PutBucketMeta(name, fn)
}
func (s *Service) ListObjectsPage(bucket, prefix, marker string, maxKeys int) ([]store.ObjectInfo, string, bool, error) {
	return s.engine.ListObjectsPage(bucket, prefix, marker, maxKeys)
}
func (s *Service) PutObject(bucket, key, contentType string, body []byte) (store.ObjectInfo, error) {
	return s.engine.PutObject(bucket, key, contentType, body)
}
func (s *Service) HeadObject(bucket, key string) (store.ObjectInfo, error) {
	return s.engine.HeadObject(bucket, key)
}
func (s *Service) GetObject(bucket, key string) (store.ObjectInfo, []byte, error) {
	return s.engine.GetObject(bucket, key)
}
func (s *Service) DeleteObject(bucket, key string) error {
	return s.engine.DeleteObject(bucket, key)
}
func (s *Service) UpdateObjectMeta(bucket, key string, fn func(*store.ObjectInfo)) error {
	return s.engine.UpdateObjectMeta(bucket, key, fn)
}
func (s *Service) DiskStats(path string) map[string]any {
	return store.DiskStats(path)
}
