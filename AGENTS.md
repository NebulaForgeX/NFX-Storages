# Codex / agent notes for NFX-Storages

Scaffolding follows **CityPulso PulsoLoop-API** (Taskfile `start`/`run`/`errors`/`atlas`/`databases`, errors i18n, databases/scripts, license-free DB pipeline) and **NFX-Identity** (console, testdb/cleardata, Edge attach).

HTTP ingress is **only NFX-Edge**. This repo does not run Traefik.

Do **not** copy News leftover error codes (`NEWS_*`, `SOURCE_*`) or Loop badminton seed scripts. Storages domain errors live in `errors/src/storages/codes.go` and must be returned from S3/IAM/admin — not `errors.New("AccessDenied")`.

When changing Go code, prefer gopls for compile diagnostics and references.
