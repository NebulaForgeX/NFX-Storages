package iam

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccessKey struct {
	AccessKey    string     `gorm:"column:access_key;primaryKey" json:"access_key"`
	SecretKey    string     `gorm:"column:secret_key" json:"secret_key"`
	Status       string     `gorm:"column:status" json:"status"`
	Name         string     `gorm:"column:name" json:"name"`
	Description  string     `gorm:"column:description" json:"description"`
	ParentKey    *string    `gorm:"column:parent_key" json:"parent_key,omitempty"`
	AccountID    *string    `gorm:"column:account_id" json:"account_id,omitempty"`
	ProfileID    *string    `gorm:"column:profile_id" json:"profile_id,omitempty"`
	PolicyName   *string    `gorm:"column:policy_name" json:"policy_name,omitempty"`
	SessionToken *string    `gorm:"column:session_token" json:"session_token,omitempty"`
	ExpiresAt    *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`
	CreatedAt    time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

func (AccessKey) TableName() string { return "storages.access_keys" }

type Policy struct {
	Name      string    `gorm:"column:name;primaryKey" json:"name"`
	Document  string    `gorm:"column:document;type:jsonb" json:"policy"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Policy) TableName() string { return "storages.policies" }

type Group struct {
	Name      string    `gorm:"column:name;primaryKey" json:"name"`
	Status    string    `gorm:"column:status" json:"status"`
	Members   string    `gorm:"column:members;type:jsonb" json:"members"`
	Policy    *string   `gorm:"column:policy_name" json:"policy,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Group) TableName() string { return "storages.groups" }

type EventTarget struct {
	Type      string    `gorm:"column:target_type;primaryKey" json:"type"`
	Name      string    `gorm:"column:name;primaryKey" json:"name"`
	Config    string    `gorm:"column:config;type:jsonb" json:"config"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (EventTarget) TableName() string { return "storages.event_targets" }

type Tier struct {
	Name      string    `gorm:"column:name;primaryKey" json:"name"`
	Config    string    `gorm:"column:config;type:jsonb" json:"config"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Tier) TableName() string { return "storages.tiers" }

type KMSKey struct {
	KeyID       string     `gorm:"column:key_id;primaryKey" json:"key_id"`
	Status      string     `gorm:"column:status" json:"status"`
	Description string     `gorm:"column:description" json:"description"`
	DeleteAt    *time.Time `gorm:"column:delete_at" json:"delete_at,omitempty"`
	CreatedAt   time.Time  `gorm:"column:created_at" json:"created_at"`
}

func (KMSKey) TableName() string { return "storages.kms_keys" }

type KMSState struct {
	ID     string `gorm:"column:id;primaryKey" json:"id"`
	Status string `gorm:"column:status" json:"status"`
	Config string `gorm:"column:config;type:jsonb" json:"config"`
}

func (KMSState) TableName() string { return "storages.kms_state" }

type RemoteTarget struct {
	Bucket    string    `gorm:"column:bucket;primaryKey" json:"bucket"`
	ARN       string    `gorm:"column:arn;primaryKey" json:"arn"`
	Config    string    `gorm:"column:config;type:jsonb" json:"config"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (RemoteTarget) TableName() string { return "storages.remote_targets" }

type Service struct{ db *gorm.DB }

func New(db *gorm.DB) *Service { return &Service{db: db} }

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (s *Service) CreateAccessKey(access, secret, status string, accountID, profileID *string) (AccessKey, error) {
	return s.CreateNamedKey(access, secret, status, "", "", "", accountID, profileID)
}

func (s *Service) CreateNamedKey(access, secret, status, name, description, parent string, accountID, profileID *string) (AccessKey, error) {
	if access == "" {
		access = strings.ToUpper(randomHex(10))
	}
	if secret == "" {
		secret = randomHex(20)
	}
	if status == "" {
		status = "enabled"
	}
	row := AccessKey{
		AccessKey: access, SecretKey: secret, Status: status, Name: name, Description: description,
		AccountID: accountID, ProfileID: profileID, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	if parent != "" {
		row.ParentKey = &parent
	}
	if err := s.db.Create(&row).Error; err != nil {
		return AccessKey{}, err
	}
	return row, nil
}

func (s *Service) EnsureProfileKey(accountID, profileID string) (AccessKey, error) {
	var row AccessKey
	q := s.db.Where("account_id = ? AND status = ? AND parent_key IS NULL", accountID, "enabled")
	if profileID != "" {
		q = s.db.Where("account_id = ? AND profile_id = ? AND status = ? AND parent_key IS NULL", accountID, profileID, "enabled")
	}
	err := q.First(&row).Error
	if err == nil {
		return row, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return AccessKey{}, err
	}
	return s.CreateAccessKey("", "", "enabled", &accountID, &profileID)
}

func (s *Service) IssueSession(parent AccessKey, ttl time.Duration) (AccessKey, error) {
	if parent.Status != "enabled" {
		return AccessKey{}, errors.New("key disabled")
	}
	token := randomHex(24)
	exp := time.Now().UTC().Add(ttl)
	row, err := s.CreateNamedKey("", "", "enabled", parent.Name, "session", parent.AccessKey, parent.AccountID, parent.ProfileID)
	if err != nil {
		return AccessKey{}, err
	}
	row.SessionToken = &token
	row.ExpiresAt = &exp
	row.PolicyName = parent.PolicyName
	_ = s.db.Model(&AccessKey{}).Where("access_key = ?", row.AccessKey).Updates(map[string]any{
		"session_token": token, "expires_at": exp, "policy_name": parent.PolicyName, "updated_at": time.Now().UTC(),
	}).Error
	return row, nil
}

func (s *Service) MintSession(accessKey string, ttl time.Duration) (AccessKey, error) {
	row, err := s.Lookup(accessKey)
	if err != nil {
		return AccessKey{}, err
	}
	return s.IssueSession(row, ttl)
}

func (s *Service) Lookup(accessKey string) (AccessKey, error) {
	var row AccessKey
	if err := s.db.First(&row, "access_key = ?", accessKey).Error; err != nil {
		return AccessKey{}, err
	}
	if row.Status != "enabled" {
		return AccessKey{}, errors.New("key disabled")
	}
	if row.ExpiresAt != nil && time.Now().UTC().After(*row.ExpiresAt) {
		return AccessKey{}, errors.New("key expired")
	}
	return row, nil
}

func (s *Service) MatchSession(row AccessKey, token string) bool {
	if row.SessionToken == nil || *row.SessionToken == "" {
		return token == ""
	}
	return token == "" || token == *row.SessionToken
}

func (s *Service) ListUsers() map[string]any {
	var rows []AccessKey
	_ = s.db.Where("parent_key IS NULL").Find(&rows).Error
	out := map[string]any{}
	for _, r := range rows {
		out[r.AccessKey] = map[string]any{
			"status": r.Status, "policyName": r.PolicyName, "name": r.Name, "memberOf": s.GroupsForUser(r.AccessKey),
		}
	}
	return out
}

func (s *Service) ListServiceAccounts() map[string]any {
	var rows []AccessKey
	_ = s.db.Find(&rows).Error
	accounts := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		accounts = append(accounts, map[string]any{
			"accessKey": r.AccessKey, "expiration": r.ExpiresAt, "name": r.Name,
			"description": r.Description, "accountStatus": r.Status, "parentUser": r.ParentKey,
		})
	}
	return map[string]any{"accounts": accounts}
}

func (s *Service) ListServiceAccountsForUser(parent string) []map[string]any {
	var rows []AccessKey
	_ = s.db.Where("parent_key = ?", parent).Find(&rows).Error
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		out = append(out, map[string]any{
			"accessKey": r.AccessKey, "expiration": r.ExpiresAt, "name": r.Name,
			"description": r.Description, "accountStatus": r.Status,
		})
	}
	return out
}

func (s *Service) DeleteUser(access string) error {
	_ = s.db.Delete(&AccessKey{}, "parent_key = ?", access).Error
	return s.db.Delete(&AccessKey{}, "access_key = ?", access).Error
}

func (s *Service) UpdateUser(access string, patch map[string]any) error {
	allowed := map[string]any{}
	for _, k := range []string{"status", "name", "description", "policy_name", "secret_key"} {
		if v, ok := patch[k]; ok {
			allowed[k] = v
		}
	}
	if st, ok := patch["status"].(string); ok {
		allowed["status"] = st
	}
	if sk, ok := patch["secretKey"].(string); ok && sk != "" {
		allowed["secret_key"] = sk
	}
	if pn, ok := patch["policyName"].(string); ok {
		allowed["policy_name"] = pn
	}
	if len(allowed) == 0 {
		return nil
	}
	allowed["updated_at"] = time.Now().UTC()
	return s.db.Model(&AccessKey{}).Where("access_key = ?", access).Updates(allowed).Error
}

func (s *Service) SetUserStatus(access, status string) error {
	return s.db.Model(&AccessKey{}).Where("access_key = ?", access).Update("status", status).Error
}

func (s *Service) GetUser(access string) (map[string]any, error) {
	row, err := s.Lookup(access)
	if err != nil {
		var disabled AccessKey
		if e := s.db.First(&disabled, "access_key = ?", access).Error; e != nil {
			return nil, err
		}
		row = disabled
	}
	return map[string]any{
		"accessKey": row.AccessKey, "status": row.Status, "policyName": row.PolicyName,
		"name": row.Name, "memberOf": s.GroupsForUser(access),
	}, nil
}

func (s *Service) UserPolicies(access string) map[string]any {
	info, err := s.GetUser(access)
	if err != nil {
		return map[string]any{"policy": "", "policyName": ""}
	}
	name, _ := info["policyName"].(*string)
	doc := ""
	if name != nil && *name != "" {
		if p, e := s.GetPolicy(*name); e == nil {
			doc = p.Document
		}
	}
	return map[string]any{"policy": doc, "policyName": info["policyName"], "memberOf": info["memberOf"]}
}

func (s *Service) SetPolicyOnUser(access, policy string) error {
	return s.db.Model(&AccessKey{}).Where("access_key = ?", access).Update("policy_name", policy).Error
}

func (s *Service) AddPolicy(name, document string) error {
	row := Policy{Name: name, Document: document, CreatedAt: time.Now().UTC()}
	return s.db.Save(&row).Error
}

func (s *Service) ListPolicies() map[string]any {
	var rows []Policy
	_ = s.db.Find(&rows).Error
	out := map[string]any{}
	for _, r := range rows {
		var doc any
		_ = json.Unmarshal([]byte(r.Document), &doc)
		out[r.Name] = doc
	}
	return out
}

func (s *Service) GetPolicy(name string) (Policy, error) {
	var row Policy
	err := s.db.First(&row, "name = ?", name).Error
	return row, err
}

func (s *Service) DeletePolicy(name string) error {
	return s.db.Delete(&Policy{}, "name = ?", name).Error
}

func (s *Service) UsersForPolicy(name string) []string {
	var rows []AccessKey
	_ = s.db.Where("policy_name = ?", name).Find(&rows).Error
	out := make([]string, 0, len(rows))
	for _, r := range rows {
		out = append(out, r.AccessKey)
	}
	return out
}

func (s *Service) SetPolicyMultiple(policy string, users, groups []string) error {
	for _, u := range users {
		_ = s.SetPolicyOnUser(u, policy)
	}
	for _, g := range groups {
		_ = s.UpsertGroup(g, "", nil, &policy)
	}
	return nil
}

func (s *Service) UpsertGroup(name, status string, members []string, policy *string) error {
	if name == "" {
		return errors.New("group name required")
	}
	var existing Group
	err := s.db.First(&existing, "name = ?", name).Error
	if status == "" {
		status = existing.Status
		if status == "" {
			status = "enabled"
		}
	}
	raw := existing.Members
	if members != nil {
		b, _ := json.Marshal(members)
		raw = string(b)
	} else if raw == "" {
		raw = "[]"
	}
	if policy == nil {
		policy = existing.Policy
	}
	row := Group{Name: name, Status: status, Members: raw, Policy: policy, CreatedAt: time.Now().UTC()}
	if err == nil {
		row.CreatedAt = existing.CreatedAt
	}
	return s.db.Save(&row).Error
}

func (s *Service) SetUserGroups(access string, groups []string) error {
	var all []Group
	_ = s.db.Find(&all).Error
	want := map[string]bool{}
	for _, g := range groups {
		want[g] = true
	}
	for _, g := range all {
		var members []string
		_ = json.Unmarshal([]byte(g.Members), &members)
		has := false
		next := make([]string, 0, len(members))
		for _, m := range members {
			if m == access {
				has = true
				continue
			}
			next = append(next, m)
		}
		if want[g.Name] && !has {
			next = append(next, access)
		}
		if want[g.Name] || has {
			_ = s.UpsertGroup(g.Name, g.Status, next, g.Policy)
		}
		delete(want, g.Name)
	}
	for name := range want {
		_ = s.UpsertGroup(name, "enabled", []string{access}, nil)
	}
	return nil
}

func (s *Service) GroupsForUser(access string) []string {
	var rows []Group
	_ = s.db.Find(&rows).Error
	out := []string{}
	for _, r := range rows {
		var members []string
		_ = json.Unmarshal([]byte(r.Members), &members)
		for _, m := range members {
			if m == access {
				out = append(out, r.Name)
				break
			}
		}
	}
	return out
}

func (s *Service) ListGroups() []string {
	var rows []Group
	_ = s.db.Find(&rows).Error
	out := make([]string, 0, len(rows))
	for _, r := range rows {
		out = append(out, r.Name)
	}
	return out
}

func (s *Service) GetGroup(name string) (map[string]any, error) {
	var row Group
	if err := s.db.First(&row, "name = ?", name).Error; err != nil {
		return nil, err
	}
	var members []string
	_ = json.Unmarshal([]byte(row.Members), &members)
	return map[string]any{"name": row.Name, "status": row.Status, "members": members, "policy": row.Policy}, nil
}

func (s *Service) DeleteGroup(name string) error {
	return s.db.Delete(&Group{}, "name = ?", name).Error
}

func (s *Service) SetGroupStatus(name, status string) error {
	return s.db.Model(&Group{}).Where("name = ?", name).Update("status", status).Error
}

func (s *Service) SaveTarget(typ, name string, cfg any) error {
	raw, _ := json.Marshal(cfg)
	return s.db.Save(&EventTarget{Type: typ, Name: name, Config: string(raw), CreatedAt: time.Now().UTC()}).Error
}

func (s *Service) ListTargets() []EventTarget {
	var rows []EventTarget
	_ = s.db.Find(&rows).Error
	return rows
}

func (s *Service) NotificationEndpoints() map[string]any {
	rows := s.ListTargets()
	eps := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		eps = append(eps, map[string]any{"account_id": r.Name, "service": r.Type, "status": "online"})
	}
	return map[string]any{"notification_endpoints": eps}
}

func (s *Service) DeleteTarget(typ, name string) error {
	return s.db.Delete(&EventTarget{}, "target_type = ? AND name = ?", typ, name).Error
}

func (s *Service) SaveTier(name string, cfg any) error {
	if name == "" {
		if m, ok := cfg.(map[string]any); ok {
			if n, ok := m["name"].(string); ok {
				name = n
			}
			if nested, ok := m["s3"].(map[string]any); ok {
				if n, ok := nested["name"].(string); ok && name == "" {
					name = n
				}
			}
		}
	}
	raw, _ := json.Marshal(cfg)
	return s.db.Save(&Tier{Name: name, Config: string(raw), CreatedAt: time.Now().UTC()}).Error
}

func (s *Service) ListTiers() []map[string]any {
	var rows []Tier
	_ = s.db.Find(&rows).Error
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		var cfg map[string]any
		if json.Unmarshal([]byte(r.Config), &cfg) != nil || cfg == nil {
			cfg = map[string]any{"type": "s3", "s3": map[string]any{"name": r.Name}}
		}
		if _, ok := cfg["type"]; !ok {
			cfg["type"] = "s3"
		}
		if _, ok := cfg["s3"]; !ok {
			cfg["s3"] = map[string]any{"name": r.Name}
		}
		out = append(out, cfg)
	}
	return out
}

func (s *Service) DeleteTier(name string) error {
	return s.db.Delete(&Tier{}, "name = ?", name).Error
}

func (s *Service) CreateKMSKey(description string) KMSKey {
	row := KMSKey{KeyID: uuid.NewString(), Status: "enabled", Description: description, CreatedAt: time.Now().UTC()}
	_ = s.db.Create(&row).Error
	return row
}

func (s *Service) ListKMSKeys() []KMSKey {
	var rows []KMSKey
	_ = s.db.Find(&rows).Error
	return rows
}

func (s *Service) GetKMSKey(id string) (KMSKey, error) {
	var row KMSKey
	err := s.db.First(&row, "key_id = ?", id).Error
	return row, err
}

func (s *Service) DeleteKMSKey(id string) error {
	return s.db.Delete(&KMSKey{}, "key_id = ?", id).Error
}

func (s *Service) ScheduleKMSKeyDelete(id string, immediate bool) error {
	if immediate {
		return s.DeleteKMSKey(id)
	}
	at := time.Now().UTC().Add(7 * 24 * time.Hour)
	return s.db.Model(&KMSKey{}).Where("key_id = ?", id).Updates(map[string]any{"status": "pending-deletion", "delete_at": at}).Error
}

func (s *Service) CancelKMSKeyDelete(id string) error {
	return s.db.Model(&KMSKey{}).Where("key_id = ?", id).Updates(map[string]any{"status": "enabled", "delete_at": nil}).Error
}

func (s *Service) KMSStatus() map[string]any {
	st := s.ensureKMSState()
	var cfg any
	_ = json.Unmarshal([]byte(st.Config), &cfg)
	return map[string]any{"status": st.Status, "config": cfg}
}

func (s *Service) SetKMSStatus(status string) error {
	st := s.ensureKMSState()
	return s.db.Model(&KMSState{}).Where("id = ?", st.ID).Update("status", status).Error
}

func (s *Service) SetKMSConfig(cfg any) error {
	raw, _ := json.Marshal(cfg)
	st := s.ensureKMSState()
	return s.db.Model(&KMSState{}).Where("id = ?", st.ID).Updates(map[string]any{"config": string(raw), "status": "configured"}).Error
}

func (s *Service) GenerateDataKey() map[string]any {
	plain := randomHex(32)
	cipher := randomHex(32)
	return map[string]any{"plaintext": plain, "ciphertext": cipher, "key_id": "local"}
}

func (s *Service) ensureKMSState() KMSState {
	var st KMSState
	if err := s.db.First(&st, "id = ?", "local").Error; err != nil {
		st = KMSState{ID: "local", Status: "stopped", Config: "{}"}
		_ = s.db.Create(&st).Error
	}
	return st
}

func (s *Service) SaveRemoteTarget(bucket, arn string, cfg any) error {
	if arn == "" {
		arn = "arn:nfxstorages:replication:::" + bucket + ":" + uuid.NewString()
	}
	raw, _ := json.Marshal(cfg)
	return s.db.Save(&RemoteTarget{Bucket: bucket, ARN: arn, Config: string(raw), CreatedAt: time.Now().UTC()}).Error
}

func (s *Service) ListRemoteTargets(bucket string) []map[string]any {
	var rows []RemoteTarget
	q := s.db
	if bucket != "" {
		q = q.Where("bucket = ?", bucket)
	}
	_ = q.Find(&rows).Error
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		var cfg any
		_ = json.Unmarshal([]byte(r.Config), &cfg)
		out = append(out, map[string]any{"bucket": r.Bucket, "arn": r.ARN, "config": cfg})
	}
	return out
}

func (s *Service) DeleteRemoteTarget(bucket, arn string) error {
	return s.db.Delete(&RemoteTarget{}, "bucket = ? AND arn = ?", bucket, arn).Error
}

func (s *Service) DumpIAM() map[string]any {
	var keys []AccessKey
	var policies []Policy
	var groups []Group
	_ = s.db.Find(&keys).Error
	_ = s.db.Find(&policies).Error
	_ = s.db.Find(&groups).Error
	return map[string]any{"users": keys, "policies": policies, "groups": groups}
}

func (s *Service) ImportIAM(dump map[string]any) error {
	if users, ok := dump["users"].([]any); ok {
		for _, u := range users {
			raw, _ := json.Marshal(u)
			var row AccessKey
			if json.Unmarshal(raw, &row) == nil && row.AccessKey != "" {
				_ = s.db.Save(&row).Error
			}
		}
	}
	if users, ok := dump["users"].(map[string]any); ok {
		for access, info := range users {
			status := "enabled"
			if m, ok := info.(map[string]any); ok {
				if st, ok := m["status"].(string); ok {
					status = st
				}
			}
			_, _ = s.CreateAccessKey(access, "", status, nil, nil)
		}
	}
	if policies, ok := dump["policies"].([]any); ok {
		for _, p := range policies {
			raw, _ := json.Marshal(p)
			var row Policy
			if json.Unmarshal(raw, &row) == nil && row.Name != "" {
				_ = s.db.Save(&row).Error
			}
		}
	}
	if policies, ok := dump["policies"].(map[string]any); ok {
		for name, doc := range policies {
			raw, _ := json.Marshal(doc)
			_ = s.AddPolicy(name, string(raw))
		}
	}
	if groups, ok := dump["groups"].([]any); ok {
		for _, g := range groups {
			if name, ok := g.(string); ok {
				_ = s.UpsertGroup(name, "enabled", []string{}, nil)
				continue
			}
			raw, _ := json.Marshal(g)
			var row Group
			if json.Unmarshal(raw, &row) == nil && row.Name != "" {
				_ = s.db.Save(&row).Error
			}
		}
	}
	return nil
}
