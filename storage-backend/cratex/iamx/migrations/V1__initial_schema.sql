-- Initial IAM schema migration
-- Version: 1
-- Description: Create all initial IAM tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    access_key VARCHAR(255) NOT NULL UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_access_key ON users(access_key);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    policy_doc JSONB NOT NULL,
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_name ON policies(name);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'enabled',
    members JSONB NOT NULL DEFAULT '[]'::jsonb,
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);

-- Create mapped_policies table
CREATE TABLE IF NOT EXISTS mapped_policies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    is_group BOOLEAN NOT NULL DEFAULT false,
    policies TEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, user_type, is_group)
);

CREATE INDEX IF NOT EXISTS idx_mapped_policies_name ON mapped_policies(name);
CREATE INDEX IF NOT EXISTS idx_mapped_policies_user_type ON mapped_policies(user_type);
CREATE INDEX IF NOT EXISTS idx_mapped_policies_is_group ON mapped_policies(is_group);

-- Create user_identities table
CREATE TABLE IF NOT EXISTS user_identities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    identity_data JSONB NOT NULL,
    ttl INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, user_type)
);

CREATE INDEX IF NOT EXISTS idx_user_identities_name ON user_identities(name);
CREATE INDEX IF NOT EXISTS idx_user_identities_user_type ON user_identities(user_type);

