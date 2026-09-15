// Atlas configuration for nfxstorages service using PostgreSQL.
// Using Docker Atlas toolchain.

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

variable "db_dev_name" {
  type    = string
  default = getenv("POSTGRES_DB_DEV")
}

variable "db_prod_name" {
  type    = string
  default = getenv("POSTGRES_DB_PROD")
}

variable "db_shadow_name" {
  type    = string
  default = getenv("POSTGRES_DB_SHADOW")
}

// === Local configuration ===
locals {
  query_params = "sslmode=disable&TimeZone=UTC"
  src_file           = "file://src/main.sql"
  migration_dir_dev  = "file://migrations/development"
  migration_dir_prod = "file://migrations/production"
  template_helpers = "templates/_helpers.tmpl"
  template_models  = "templates/gen_models.tmpl"
  template_views   = "templates/gen_views.tmpl"
  template_enums   = "templates/gen_enums.tmpl"
  
  // Database connection URLs
  db_url_base = "postgres://${var.db_user}:${urlescape(var.db_password)}@${var.db_host}:${var.db_port}"
  dev_shadow  = "${local.db_url_base}/${var.db_shadow_name}?${local.query_params}"
  dev_url     = "${local.db_url_base}/${var.db_dev_name}?${local.query_params}"
  prod_url    = "${local.db_url_base}/${var.db_prod_name}?${local.query_params}"
  
  // Format configuration values
  format_migrate_diff   = "{{ sql . \"  \"}}"
  format_schema_inspect = "{{ sql . | split | write \"src\" }}"
  
  // Template content for code generation
  template_helpers_content = file(local.template_helpers)
  template_models_content  = "${local.template_helpers_content}${file(local.template_models)}"
  template_views_content   = "${local.template_helpers_content}${file(local.template_views)}"
  template_enums_content   = "${local.template_helpers_content}${file(local.template_enums)}"
  
  // Common exclude list for generation environments
  exclude_public = ["public"]
}

// === Development environment ===
env "dev" {
  src = local.src_file
  url = local.dev_url
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

// === Production environment ===
env "prod" {
  src = local.src_file
  url = local.prod_url
  dev = local.dev_shadow
  migration {
    dir = local.migration_dir_prod
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
