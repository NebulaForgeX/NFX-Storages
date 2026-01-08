# NebulaFX Environment Variables

This document describes the environment variables that can be used to configure NebulaFX behavior.

## Background Services Control

### NEUBULAFX_ENABLE_SCANNER

Controls whether the data scanner service should be started.

- **Default**: `true`
- **Valid values**: `true`, `false`
- **Description**: When enabled, the data scanner will run background scans to detect inconsistencies and corruption in stored data.

**Examples**:
```bash
# Disable scanner
export NEUBULAFX_ENABLE_SCANNER=false

# Enable scanner (default behavior)
export NEUBULAFX_ENABLE_SCANNER=true
```

### NEUBULAFX_ENABLE_HEAL

Controls whether the auto-heal service should be started.

- **Default**: `true`
- **Valid values**: `true`, `false` 
- **Description**: When enabled, the heal manager will automatically repair detected data inconsistencies and corruption.

**Examples**:
```bash
# Disable auto-heal
export NEUBULAFX_ENABLE_HEAL=false

# Enable auto-heal (default behavior)
export NEUBULAFX_ENABLE_HEAL=true
```

### NEUBULAFX_ENABLE_LOCKS

Controls whether the distributed lock system should be enabled.

- **Default**: `true`
- **Valid values**: `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off`, `enabled`, `disabled` (case insensitive)
- **Description**: When enabled, provides distributed locking for concurrent object operations. When disabled, all lock operations immediately return success without actual locking.

**Examples**:
```bash
# Disable lock system
export NEUBULAFX_ENABLE_LOCKS=false

# Enable lock system (default behavior)
export NEUBULAFX_ENABLE_LOCKS=true
```

## Service Combinations

The scanner and heal services can be independently controlled:

| NEUBULAFX_ENABLE_SCANNER | NEUBULAFX_ENABLE_HEAL | Result |
|----------------------|-------------------|--------|
| `true` (default)     | `true` (default)  | Both scanner and heal are active |
| `true`               | `false`           | Scanner runs without heal capabilities |
| `false`              | `true`            | Heal manager is available but no scanning |
| `false`              | `false`           | No background maintenance services |

## Use Cases

### Development Environment
For development or testing environments where you don't need background maintenance:
```bash
export NEUBULAFX_ENABLE_SCANNER=false
export NEUBULAFX_ENABLE_HEAL=false
./nebulafx --address 127.0.0.1:9000 ...
```

### Scan-Only Mode
For environments where you want to detect issues but not automatically fix them:
```bash
export NEUBULAFX_ENABLE_SCANNER=true
export NEUBULAFX_ENABLE_HEAL=false
./nebulafx --address 127.0.0.1:9000 ...
```

### Heal-Only Mode  
For environments where external tools trigger healing but no automatic scanning:
```bash
export NEUBULAFX_ENABLE_SCANNER=false
export NEUBULAFX_ENABLE_HEAL=true
./nebulafx --address 127.0.0.1:9000 ...
```

### Production Environment (Default)
For production environments where both services should be active:
```bash
# These are the defaults, so no need to set explicitly
# export NEUBULAFX_ENABLE_SCANNER=true
# export NEUBULAFX_ENABLE_HEAL=true
./nebulafx --address 127.0.0.1:9000 ...
```

### No-Lock Development
For single-node development where locking is not needed:
```bash
export NEUBULAFX_ENABLE_LOCKS=false
./nebulafx --address 127.0.0.1:9000 ...
```

## Performance Impact

- **Scanner**: Light to moderate CPU/IO impact during scans
- **Heal**: Moderate to high CPU/IO impact during healing operations
- **Locks**: Minimal CPU/memory overhead for coordination; disabling can improve throughput in single-client scenarios
- **Memory**: Each service uses additional memory for processing queues and metadata

Disabling these services in resource-constrained environments can improve performance for primary storage operations.