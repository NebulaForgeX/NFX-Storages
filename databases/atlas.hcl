// Atlas configuration for nfxstorages using PostgreSQL.
// Schema source: databases/src.

// === Public variables ===
variable "db_user" {
  type    = string
  default = getenv("POSTGRES_USER")
}

variable "db_password" {
  type    = string
  default = getenv("POSTGRES_PASSWORD")
}

variable "db_host" {
  type    = string
  default = getenv("POSTGRES_HOST")
}

variable "db_port" {
  type    = string
  default = getenv("POSTGRES_PORT")
}

variable "db_name" {
  type    = string
  default = getenv("POSTGRES_DB")
}

variable "db_shadow_name" {
  type    = string
  default = getenv("POSTGRES_DB_SHADOW")
}

// === Local configuration ===
locals {
  // RDS / managed Postgres: use POSTGRES_SSLMODE=require (or verify-full). Local: disable.
  // 推荐直接写 libpq sslmode；true|false|1|0 仅作兼容映射到 require|disable。
  _ssl_raw = lower(trimspace(getenv("POSTGRES_SSLMODE")))
  _ssl_on  = contains(["true", "1", "yes", "on"], local._ssl_raw)
  _ssl_off = contains(["false", "0", "no", "off"], local._ssl_raw)
  _ssl_from_env = local._ssl_on ? "require" : (local._ssl_off ? "disable" : local._ssl_raw)
  sslmode = local._ssl_from_env != "" ? local._ssl_from_env : (
    contains(["127.0.0.1", "localhost", "::1"], var.db_host) ? "disable" : "require"
  )
  query_params       = "sslmode=${local.sslmode}&TimeZone=UTC"
  src_file             = "file://src/main.sql"
  migration_dir_dev    = "file://migrations/development"
  migration_dir_secure = "file://migrations/secure"
  template_helpers     = "templates/_helpers.tmpl"
  template_models    = "templates/gen_models.tmpl"
  template_views     = "templates/gen_views.tmpl"
  template_enums     = "templates/gen_enums.tmpl"

  db_url_base = "postgres://${var.db_user}:${urlescape(var.db_password)}@${var.db_host}:${var.db_port}"
  dev_shadow  = "${local.db_url_base}/${var.db_shadow_name}?${local.query_params}"
  // Single target DB: value comes from the active dotenv (.env -> pulsonear_dev, .secure.env -> pulsonear_secure).
  db_url = "${local.db_url_base}/${var.db_name}?${local.query_params}"

  format_migrate_diff   = "{{ sql . \"  \"}}"
  format_schema_inspect = "{{ sql . | split | write \"src\" }}"

  template_helpers_content = file(local.template_helpers)
  template_models_content  = "${local.template_helpers_content}${file(local.template_models)}"
  template_views_content   = "${local.template_helpers_content}${file(local.template_views)}"
  template_enums_content   = "${local.template_helpers_content}${file(local.template_enums)}"
  exclude_public           = ["public"]
}

// === Development environment ===
env "dev" {
  src = local.src_file
  url = local.db_url
  dev = local.dev_shadow
  migration {
    dir = local.migration_dir_dev
  }
  format {
    migrate {
      diff = local.format_migrate_diff
    }
    schema {
      inspect = local.format_schema_inspect
    }
  }
  lint {
    destructive {
      error = true
    }
  }
}

// === Secure (production) environment ===
env "secure" {
  src = local.src_file
  url = local.db_url
  dev = local.dev_shadow
  migration {
    dir = local.migration_dir_secure
  }
  format {
    migrate {
      diff = local.format_migrate_diff
    }
    schema {
      inspect = local.format_schema_inspect
    }
  }
  lint {
    destructive {
      error = true
    }
  }
}

// === Generate Go models ===
env "gen-models" {
  url     = local.src_file
  dev     = local.dev_shadow
  exclude = local.exclude_public
  format {
    schema {
      inspect = local.template_models_content
    }
  }
}

// === Generate views ===
env "gen-views" {
  url     = local.src_file
  dev     = local.dev_shadow
  exclude = local.exclude_public
  format {
    schema {
      inspect = local.template_views_content
    }
  }
}

// === Generate enums ===
env "gen-enums" {
  url  = local.src_file
  dev  = local.dev_shadow
  format {
    schema {
      inspect = local.template_enums_content
    }
  }
}
