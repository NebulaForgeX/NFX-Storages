package sigv4

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/url"
	"sort"
	"strings"
)

type HeaderBag interface {
	Get(key string) string
	Host() string
	Method() string
	Path() string
	Query() string
}

func HMACSHA256(key []byte, data string) []byte {
	m := hmac.New(sha256.New, key)
	m.Write([]byte(data))
	return m.Sum(nil)
}

func HashSHA256(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func ParseAuthorization(header string) (accessKey, signature, signedHeaders, region, dateScope string, ok bool) {
	if !strings.HasPrefix(header, "AWS4-HMAC-SHA256 ") {
		return
	}
	rest := strings.TrimPrefix(header, "AWS4-HMAC-SHA256 ")
	parts := strings.Split(rest, ",")
	vals := map[string]string{}
	for _, p := range parts {
		kv := strings.SplitN(strings.TrimSpace(p), "=", 2)
		if len(kv) == 2 {
			vals[kv[0]] = strings.TrimSpace(kv[1])
		}
	}
	cred := vals["Credential"]
	cs := strings.Split(cred, "/")
	if len(cs) < 5 {
		return
	}
	accessKey = cs[0]
	dateScope = cs[1]
	region = cs[2]
	signature = vals["Signature"]
	signedHeaders = vals["SignedHeaders"]
	ok = accessKey != "" && signature != ""
	return
}

func Verify(h HeaderBag, body []byte, secret, signedHeaders, dateScope, expectedSig, region string) bool {
	return VerifyService(h, body, secret, signedHeaders, dateScope, expectedSig, region, "s3") ||
		VerifyService(h, body, secret, signedHeaders, dateScope, expectedSig, region, "sts")
}

func VerifyService(h HeaderBag, body []byte, secret, signedHeaders, dateScope, expectedSig, region, service string) bool {
	if region == "" {
		region = "us-east-1"
	}
	if service == "" {
		service = "s3"
	}
	canonical := canonicalRequest(h, body, signedHeaders)
	hashed := HashSHA256([]byte(canonical))
	amzDate := h.Get("X-Amz-Date")
	scope := dateScope + "/" + region + "/" + service + "/aws4_request"
	sts := "AWS4-HMAC-SHA256\n" + amzDate + "\n" + scope + "\n" + hashed
	kDate := HMACSHA256([]byte("AWS4"+secret), dateScope)
	kRegion := HMACSHA256(kDate, region)
	kService := HMACSHA256(kRegion, service)
	kSigning := HMACSHA256(kService, "aws4_request")
	sig := hex.EncodeToString(HMACSHA256(kSigning, sts))
	return hmac.Equal([]byte(strings.ToLower(sig)), []byte(strings.ToLower(expectedSig)))
}

func canonicalRequest(h HeaderBag, body []byte, signedHeaders string) string {
	payloadHash := h.Get("X-Amz-Content-Sha256")
	if payloadHash == "" {
		payloadHash = HashSHA256(body)
	}
	headers := strings.Split(signedHeaders, ";")
	sort.Strings(headers)
	var canonHdr strings.Builder
	for _, name := range headers {
		val := strings.TrimSpace(h.Get(name))
		if strings.EqualFold(name, "host") && val == "" {
			val = h.Host()
		}
		canonHdr.WriteString(strings.ToLower(name))
		canonHdr.WriteString(":")
		canonHdr.WriteString(val)
		canonHdr.WriteString("\n")
	}
	return strings.Join([]string{
		h.Method(),
		h.Path(),
		canonicalQuery(h.Query()),
		canonHdr.String(),
		signedHeaders,
		payloadHash,
	}, "\n")
}

func canonicalQuery(raw string) string {
	if raw == "" {
		return ""
	}
	v, err := url.ParseQuery(raw)
	if err != nil {
		return raw
	}
	keys := make([]string, 0, len(v))
	for k := range v {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		vals := v[k]
		sort.Strings(vals)
		for _, val := range vals {
			parts = append(parts, url.QueryEscape(k)+"="+url.QueryEscape(val))
		}
	}
	return strings.Join(parts, "&")
}
