package handler

import (
	"archive/zip"
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io"
	"strings"
	"time"

	authconn "nfxstorages/connections/auth"
	"nfxstorages/engine/iam"
	"nfxstorages/engine/sigv4"
	"nfxstorages/engine/store"
	"nfxstorages/pkgs/security/token"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type AdminHandler struct {
	store     *store.Engine
	iam       *iam.Service
	identity  *authconn.Client
	userToken token.Verifier
}

func NewAdminHandler(st *store.Engine, keys *iam.Service, identity *authconn.Client, v token.Verifier) *AdminHandler {
	return &AdminHandler{store: st, iam: keys, identity: identity, userToken: v}
}

func (h *AdminHandler) authorize(c fiber.Ctx) error {
	authz := c.Get("Authorization")
	if strings.HasPrefix(authz, "Bearer ") && h.userToken != nil {
		claims, err := h.userToken.Verify(c.Context(), strings.TrimPrefix(authz, "Bearer "))
		if err != nil {
			return fiber.NewError(401, "unauthorized")
		}
		c.Locals("claims", claims)
		return nil
	}
	ak, sig, signed, region, dateScope, ok := sigv4.ParseAuthorization(authz)
	if !ok {
		return fiber.NewError(403, "AccessDenied")
	}
	row, err := h.iam.Lookup(ak)
	if err != nil {
		return fiber.NewError(403, "InvalidAccessKeyId")
	}
	if !h.iam.MatchSession(row, c.Get("X-Amz-Security-Token")) {
		return fiber.NewError(403, "InvalidToken")
	}
	if !sigv4.Verify(fiberHdr{c}, append([]byte{}, c.Body()...), row.SecretKey, signed, dateScope, sig, region) {
		return fiber.NewError(403, "SignatureDoesNotMatch")
	}
	c.Locals("access_key", ak)
	return nil
}

type fiberHdr struct{ c fiber.Ctx }

func (h fiberHdr) Get(key string) string { return h.c.Get(key) }
func (h fiberHdr) Host() string          { return h.c.Get("Host") }
func (h fiberHdr) Method() string        { return h.c.Method() }
func (h fiberHdr) Path() string          { return h.c.Path() }
func (h fiberHdr) Query() string         { return string(h.c.Request().URI().QueryString()) }

func (h *AdminHandler) Register(g fiber.Router) {
	g.Use(func(c fiber.Ctx) error {
		if strings.HasSuffix(c.Path(), "/session/credentials") {
			return c.Next()
		}
		if err := h.authorize(c); err != nil {
			return err
		}
		return c.Next()
	})
	g.Post("/session/credentials", h.sessionCredentials)
	g.Get("/list-users", func(c fiber.Ctx) error { return c.JSON(h.iam.ListUsers()) })
	g.Put("/add-user", h.addUser)
	g.Get("/user-info", h.userInfo)
	g.Put("/user/:name", h.updateUser)
	g.Put("/user/:name/groups", h.updateUserGroups)
	g.Get("/user/policy", h.currentUserPolicy)
	g.Get("/user/:name/policies", func(c fiber.Ctx) error { return c.JSON(h.iam.UserPolicies(c.Params("name"))) })
	g.Get("/user/:name/service-accounts", func(c fiber.Ctx) error {
		return c.JSON(map[string]any{"accounts": h.iam.ListServiceAccountsForUser(c.Params("name"))})
	})
	g.Post("/user/:name/service-accounts", h.createUserServiceAccount)
	g.Post("/user/:name/service-account-credentials", h.createUserServiceAccount)
	g.Delete("/remove-user", h.removeUser)
	g.Put("/set-user-status", h.setUserStatus)
	g.Put("/set-policy", h.setPolicy)
	g.Put("/set-policy-multi", h.setPolicyMulti)
	g.Put("/set-user-or-group-policy", h.setUserOrGroupPolicy)
	g.Get("/groups", func(c fiber.Ctx) error { return c.JSON(h.iam.ListGroups()) })
	g.Get("/group", h.getGroup)
	g.Post("/groups", h.createGroup)
	g.Delete("/group/:name", func(c fiber.Ctx) error {
		_ = h.iam.DeleteGroup(c.Params("name"))
		return c.JSON(map[string]any{"status": "ok"})
	})
	g.Put("/group/:name", h.updateGroup)
	g.Put("/set-group-status", h.setGroupStatus)
	g.Put("/update-group-members", h.updateGroupMembers)
	g.Get("/list-canned-policies", func(c fiber.Ctx) error { return c.JSON(h.iam.ListPolicies()) })
	g.Post("/add-canned-policy", h.addPolicy)
	g.Get("/info-canned-policy", h.infoPolicy)
	g.Delete("/remove-canned-policy", h.removePolicy)
	g.Get("/policy/:name/users", func(c fiber.Ctx) error { return c.JSON(h.iam.UsersForPolicy(c.Params("name"))) })
	g.Get("/list-service-accounts", func(c fiber.Ctx) error { return c.JSON(h.iam.ListServiceAccounts()) })
	g.Put("/add-service-accounts", h.addUser)
	g.Get("/info-service-account", h.userInfo)
	g.Post("/update-service-account", h.updateServiceAccount)
	g.Delete("/delete-service-accounts", h.removeUser)
	g.Post("/service-account-credentials", h.addUser)
	g.Get("/info", h.info)
	g.Get("/storageinfo", h.storageInfo)
	g.Get("/datausageinfo", h.dataUsage)
	g.Get("/metrics", h.metrics)
	g.Get("/license", func(c fiber.Ctx) error {
		return c.JSON(map[string]any{"plan": "community", "organization": "NebulaForgeX", "email": ""})
	})
	g.Get("/target/list", h.listTargets)
	g.Get("/target/arns", func(c fiber.Ctx) error {
		rows := h.iam.ListTargets()
		arns := make([]string, 0, len(rows))
		for _, r := range rows {
			arns = append(arns, "arn:nfxstorages:sqs:::"+r.Type+":"+r.Name)
		}
		return c.JSON(arns)
	})
	g.Put("/target/:type/:name", h.putTarget)
	g.Delete("/target/:type/:name/reset", h.deleteTarget)
	g.Get("/tier", func(c fiber.Ctx) error { return c.JSON(h.iam.ListTiers()) })
	g.Put("/tier", h.putTier)
	g.Post("/tier/:name", h.putTier)
	g.Delete("/tier/:name", func(c fiber.Ctx) error {
		_ = h.iam.DeleteTier(c.Params("name"))
		return c.JSON(map[string]any{"status": "ok"})
	})
	g.Get("/kms/service-status", func(c fiber.Ctx) error { return c.JSON(h.iam.KMSStatus()) })
	g.Get("/kms/status", func(c fiber.Ctx) error { return c.JSON(h.iam.KMSStatus()) })
	g.Get("/kms/config", func(c fiber.Ctx) error { return c.JSON(h.iam.KMSStatus()["config"]) })
	g.Post("/kms/configure", h.configureKMS)
	g.Post("/kms/start", func(c fiber.Ctx) error {
		_ = h.iam.SetKMSStatus("running")
		return c.JSON(h.iam.KMSStatus())
	})
	g.Post("/kms/stop", func(c fiber.Ctx) error {
		_ = h.iam.SetKMSStatus("stopped")
		return c.JSON(h.iam.KMSStatus())
	})
	g.Post("/kms/reconfigure", h.configureKMS)
	g.Post("/kms/clear-cache", func(c fiber.Ctx) error { return c.JSON(map[string]any{"status": "ok"}) })
	g.Get("/kms/keys", func(c fiber.Ctx) error { return c.JSON(map[string]any{"keys": h.iam.ListKMSKeys()}) })
	g.Post("/kms/keys", h.createKMSKey)
	g.Get("/kms/keys/:id", func(c fiber.Ctx) error {
		row, err := h.iam.GetKMSKey(c.Params("id"))
		if err != nil {
			return fiber.NewError(404, "NoSuchKey")
		}
		return c.JSON(row)
	})
	g.Delete("/kms/keys/delete", func(c fiber.Ctx) error {
		_ = h.iam.ScheduleKMSKeyDelete(c.Query("keyId"), c.Query("force_immediate") == "true")
		return c.JSON(map[string]any{"status": "ok"})
	})
	g.Post("/kms/keys/cancel-deletion", func(c fiber.Ctx) error {
		var body struct {
			KeyID string `json:"key_id"`
		}
		_ = c.Bind().Body(&body)
		_ = h.iam.CancelKMSKeyDelete(body.KeyID)
		return c.JSON(map[string]any{"status": "ok"})
	})
	g.Post("/kms/generate-data-key", func(c fiber.Ctx) error { return c.JSON(h.generateDataKey(c)) })
	g.Get("/export-iam", h.exportIAM)
	g.Put("/import-iam", h.importIAM)
	g.Get("/pools/list", func(c fiber.Ctx) error {
		disks := h.store.Disks()
		return c.JSON(map[string]any{"pools": []map[string]any{{"id": "pool-0", "disks": disks}}})
	})
	g.Get("/pools/status", func(c fiber.Ctx) error {
		return c.JSON(map[string]any{"status": "online"})
	})
	g.Post("/pools/decommission", func(c fiber.Ctx) error { return c.JSON(map[string]any{"status": "accepted"}) })
	g.Post("/pools/cancel", func(c fiber.Ctx) error { return c.JSON(map[string]any{"status": "ok"}) })
	g.Put("/set-remote-target", h.setRemoteTarget)
	g.Get("/list-remote-targets", h.listRemoteTargets)
	g.Delete("/remove-remote-target", h.removeRemoteTarget)
}

func (h *AdminHandler) sessionCredentials(c fiber.Ctx) error {
	authz := c.Get("Authorization")
	if !strings.HasPrefix(authz, "Bearer ") || h.userToken == nil {
		return fiber.NewError(401, "unauthorized")
	}
	claims, err := h.userToken.Verify(c.Context(), strings.TrimPrefix(authz, "Bearer "))
	if err != nil {
		return fiber.NewError(401, "unauthorized")
	}
	accountID, _ := claims.Raw["account_id"].(string)
	profileID, _ := claims.Raw["profile_id"].(string)
	scope, _ := claims.Raw["profile_scope"].(string)
	if accountID == "" {
		accountID = claims.Registered.Subject
	}
	if h.identity != nil && profileID != "" {
		aid, err1 := uuid.Parse(accountID)
		pid, err2 := uuid.Parse(profileID)
		if err1 == nil && err2 == nil {
			ok, err := h.identity.Account.EnsureOwnedProfile(c.Context(), aid, pid, scope)
			if err != nil || !ok {
				return fiber.NewError(403, "profile not owned")
			}
		}
	}
	row, err := h.iam.EnsureProfileKey(accountID, profileID)
	if err != nil {
		return err
	}
	sess, err := h.iam.IssueSession(row, 12*time.Hour)
	if err != nil {
		return err
	}
	exp := time.Now().UTC().Add(12 * time.Hour).Format(time.RFC3339)
	if sess.ExpiresAt != nil {
		exp = sess.ExpiresAt.UTC().Format(time.RFC3339)
	}
	token := ""
	if sess.SessionToken != nil {
		token = *sess.SessionToken
	}
	return c.JSON(map[string]any{
		"AccessKeyId": sess.AccessKey, "SecretAccessKey": sess.SecretKey,
		"SessionToken": token, "Expiration": exp,
	})
}

func (h *AdminHandler) addUser(c fiber.Ctx) error {
	access := c.Query("accessKey")
	var body struct {
		SecretKey   string `json:"secretKey"`
		Status      string `json:"status"`
		AccessKey   string `json:"accessKey"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Policy      string `json:"policy"`
	}
	_ = c.Bind().Body(&body)
	if access == "" {
		access = body.AccessKey
	}
	row, err := h.iam.CreateNamedKey(access, body.SecretKey, body.Status, body.Name, body.Description, "", nil, nil)
	if err != nil {
		return err
	}
	if body.Policy != "" {
		_ = h.iam.SetPolicyOnUser(row.AccessKey, body.Policy)
	}
	return c.JSON(map[string]any{
		"status": "ok", "accessKey": row.AccessKey, "secretKey": row.SecretKey, "name": row.Name,
	})
}

func (h *AdminHandler) createUserServiceAccount(c fiber.Ctx) error {
	parent := c.Params("name")
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		SecretKey   string `json:"secretKey"`
		Policy      string `json:"policy"`
	}
	_ = c.Bind().Body(&body)
	row, err := h.iam.CreateNamedKey("", body.SecretKey, "enabled", body.Name, body.Description, parent, nil, nil)
	if err != nil {
		return err
	}
	if body.Policy != "" {
		_ = h.iam.SetPolicyOnUser(row.AccessKey, body.Policy)
	}
	return c.JSON(map[string]any{"accessKey": row.AccessKey, "secretKey": row.SecretKey, "name": row.Name})
}

func (h *AdminHandler) userInfo(c fiber.Ctx) error {
	info, err := h.iam.GetUser(c.Query("accessKey"))
	if err != nil {
		return fiber.NewError(404, err.Error())
	}
	return c.JSON(info)
}

func (h *AdminHandler) updateUser(c fiber.Ctx) error {
	var body map[string]any
	_ = c.Bind().Body(&body)
	if err := h.iam.UpdateUser(c.Params("name"), body); err != nil {
		return err
	}
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) updateUserGroups(c fiber.Ctx) error {
	var body struct {
		Groups  []string `json:"groups"`
		Members []string `json:"members"`
	}
	_ = c.Bind().Body(&body)
	groups := body.Groups
	if len(groups) == 0 {
		groups = body.Members
	}
	_ = h.iam.SetUserGroups(c.Params("name"), groups)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) currentUserPolicy(c fiber.Ctx) error {
	ak, _ := c.Locals("access_key").(string)
	return c.JSON(h.iam.UserPolicies(ak))
}

func (h *AdminHandler) removeUser(c fiber.Ctx) error {
	_ = h.iam.DeleteUser(c.Query("accessKey"))
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) setUserStatus(c fiber.Ctx) error {
	_ = h.iam.SetUserStatus(c.Query("accessKey"), c.Query("status"))
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) updateServiceAccount(c fiber.Ctx) error {
	var body map[string]any
	_ = c.Bind().Body(&body)
	_ = h.iam.UpdateUser(c.Query("accessKey"), body)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) setPolicy(c fiber.Ctx) error {
	var body map[string]any
	_ = c.Bind().Body(&body)
	name, _ := body["name"].(string)
	policy, _ := body["policy"].(string)
	if name == "" {
		name, _ = body["policyName"].(string)
	}
	if policy == "" {
		if raw, err := json.Marshal(body["policy"]); err == nil {
			policy = string(raw)
		}
	}
	if name != "" {
		_ = h.iam.AddPolicy(name, policy)
	}
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) setPolicyMulti(c fiber.Ctx) error {
	var body struct {
		Name        string   `json:"name"`
		Policy      string   `json:"policyName"`
		Users       []string `json:"users"`
		Groups      []string `json:"groups"`
		UserOrGroup []string `json:"userOrGroup"`
		IsGroup     bool     `json:"isGroup"`
	}
	_ = c.Bind().Body(&body)
	name := body.Policy
	if name == "" {
		name = body.Name
	}
	users, groups := body.Users, body.Groups
	if len(users) == 0 && !body.IsGroup {
		users = body.UserOrGroup
	}
	if len(groups) == 0 && body.IsGroup {
		groups = body.UserOrGroup
	}
	_ = h.iam.SetPolicyMultiple(name, users, groups)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) setUserOrGroupPolicy(c fiber.Ctx) error {
	user := c.Query("userOrGroup")
	policy := c.Query("policyName")
	isGroup := c.Query("isGroup")
	if isGroup == "true" {
		_ = h.iam.UpsertGroup(user, "enabled", nil, &policy)
	} else {
		_ = h.iam.SetPolicyOnUser(user, policy)
	}
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) getGroup(c fiber.Ctx) error {
	g, err := h.iam.GetGroup(c.Query("group"))
	if err != nil {
		return fiber.NewError(404, err.Error())
	}
	return c.JSON(g)
}

func (h *AdminHandler) createGroup(c fiber.Ctx) error {
	var body struct {
		Group   string   `json:"group"`
		Members []string `json:"members"`
	}
	_ = c.Bind().Body(&body)
	_ = h.iam.UpsertGroup(body.Group, "enabled", body.Members, nil)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) updateGroup(c fiber.Ctx) error {
	var body map[string]any
	_ = c.Bind().Body(&body)
	members := []string{}
	if m, ok := body["members"].([]any); ok {
		for _, x := range m {
			if s, ok := x.(string); ok {
				members = append(members, s)
			}
		}
	}
	_ = h.iam.UpsertGroup(c.Params("name"), "enabled", members, nil)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) setGroupStatus(c fiber.Ctx) error {
	_ = h.iam.SetGroupStatus(c.Query("group"), c.Query("status"))
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) updateGroupMembers(c fiber.Ctx) error {
	var body struct {
		Group   string   `json:"group"`
		Members []string `json:"members"`
	}
	_ = c.Bind().Body(&body)
	_ = h.iam.UpsertGroup(body.Group, "enabled", body.Members, nil)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) addPolicy(c fiber.Ctx) error {
	var body struct {
		Name   string `json:"name"`
		Policy any    `json:"policy"`
	}
	_ = c.Bind().Body(&body)
	raw, _ := json.Marshal(body.Policy)
	if s, ok := body.Policy.(string); ok {
		raw = []byte(s)
	}
	_ = h.iam.AddPolicy(body.Name, string(raw))
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) infoPolicy(c fiber.Ctx) error {
	row, err := h.iam.GetPolicy(c.Query("name"))
	if err != nil {
		return fiber.NewError(404, err.Error())
	}
	var doc any
	_ = json.Unmarshal([]byte(row.Document), &doc)
	return c.JSON(doc)
}

func (h *AdminHandler) removePolicy(c fiber.Ctx) error {
	_ = h.iam.DeletePolicy(c.Query("name"))
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) info(c fiber.Ctx) error {
	return c.JSON(map[string]any{
		"mode": "standalone", "region": "us-east-1", "deploymentID": "nfxstorages",
		"disks": h.store.Disks(), "runtime": "go",
	})
}

func (h *AdminHandler) storageInfo(c fiber.Ctx) error {
	disks := []map[string]any{}
	for _, d := range h.store.Disks() {
		disks = append(disks, store.DiskStats(d))
	}
	return c.JSON(map[string]any{"disks": disks})
}

func (h *AdminHandler) dataUsage(c fiber.Ctx) error {
	b, o, bytes := h.store.Usage()
	return c.JSON(map[string]any{
		"bucketsCount": b, "objectsCount": o, "objectsTotalSize": bytes, "total_used_capacity": bytes,
	})
}

func (h *AdminHandler) metrics(c fiber.Ctx) error {
	b, o, bytes := h.store.Usage()
	return c.JSON(map[string]any{"buckets": b, "objects": o, "bytes": bytes})
}

func (h *AdminHandler) listTargets(c fiber.Ctx) error {
	return c.JSON(h.iam.NotificationEndpoints())
}

func (h *AdminHandler) putTarget(c fiber.Ctx) error {
	var body any
	_ = c.Bind().Body(&body)
	_ = h.iam.SaveTarget(c.Params("type"), c.Params("name"), body)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) deleteTarget(c fiber.Ctx) error {
	_ = h.iam.DeleteTarget(c.Params("type"), c.Params("name"))
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) putTier(c fiber.Ctx) error {
	var body map[string]any
	_ = c.Bind().Body(&body)
	name := c.Params("name")
	if name == "" {
		if n, ok := body["name"].(string); ok {
			name = n
		}
	}
	_ = h.iam.SaveTier(name, body)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) configureKMS(c fiber.Ctx) error {
	var body any
	_ = c.Bind().Body(&body)
	_ = h.iam.SetKMSConfig(body)
	_ = h.iam.SetKMSStatus("configured")
	return c.JSON(h.iam.KMSStatus())
}

func (h *AdminHandler) createKMSKey(c fiber.Ctx) error {
	var body struct {
		Description string `json:"description"`
	}
	_ = c.Bind().Body(&body)
	return c.JSON(h.iam.CreateKMSKey(body.Description))
}

func (h *AdminHandler) generateDataKey(c fiber.Ctx) map[string]any {
	_ = c
	plain := make([]byte, 32)
	_, _ = rand.Read(plain)
	key := make([]byte, 32)
	_, _ = rand.Read(key)
	block, err := aes.NewCipher(key)
	if err != nil {
		return h.iam.GenerateDataKey()
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return h.iam.GenerateDataKey()
	}
	nonce := make([]byte, gcm.NonceSize())
	_, _ = rand.Read(nonce)
	ct := gcm.Seal(nonce, nonce, plain, nil)
	return map[string]any{
		"plaintext": hex.EncodeToString(plain), "ciphertext": hex.EncodeToString(ct), "key_id": "local",
	}
}

func (h *AdminHandler) exportIAM(c fiber.Ctx) error {
	dump, _ := json.Marshal(h.iam.DumpIAM())
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	w, _ := zw.Create("iam.json")
	_, _ = w.Write(dump)
	_ = zw.Close()
	c.Set("Content-Type", "application/zip")
	c.Set("Content-Disposition", `attachment; filename="iam.zip"`)
	return c.Send(buf.Bytes())
}

func (h *AdminHandler) importIAM(c fiber.Ctx) error {
	body := c.Body()
	zr, err := zip.NewReader(bytes.NewReader(body), int64(len(body)))
	if err != nil {
		var dump map[string]any
		if json.Unmarshal(body, &dump) == nil {
			_ = h.iam.ImportIAM(dump)
			return c.JSON(map[string]any{"status": "ok"})
		}
		return fiber.NewError(400, "invalid iam archive")
	}
	for _, f := range zr.File {
		if !strings.HasSuffix(strings.ToLower(f.Name), ".json") {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			continue
		}
		raw, _ := io.ReadAll(rc)
		_ = rc.Close()
		var dump map[string]any
		if json.Unmarshal(raw, &dump) == nil {
			_ = h.iam.ImportIAM(dump)
		}
	}
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) setRemoteTarget(c fiber.Ctx) error {
	var body map[string]any
	_ = c.Bind().Body(&body)
	arn, _ := body["arn"].(string)
	_ = h.iam.SaveRemoteTarget(c.Query("bucket"), arn, body)
	return c.JSON(map[string]any{"status": "ok"})
}

func (h *AdminHandler) listRemoteTargets(c fiber.Ctx) error {
	return c.JSON(h.iam.ListRemoteTargets(c.Query("bucket")))
}

func (h *AdminHandler) removeRemoteTarget(c fiber.Ctx) error {
	_ = h.iam.DeleteRemoteTarget(c.Query("bucket"), c.Query("arn"))
	return c.JSON(map[string]any{"status": "ok"})
}
