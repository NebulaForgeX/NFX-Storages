#!/bin/sh
set -e

# 1) Normalize command:
# - No arguments: default to execute nebulafx with DATA_VOLUMES
# - First argument starts with '-': treat as nebulafx arguments, auto-prefix nebulafx
# - First argument is 'nebulafx': replace with absolute path to avoid PATH interference
# - Otherwise: treat as full nebulafx arguments (e.g., /data paths)
if [ $# -eq 0 ]; then
  set -- /usr/bin/nebulafx
elif [ "${1#-}" != "$1" ]; then
  set -- /usr/bin/nebulafx "$@"
elif [ "$1" = "nebulafx" ]; then
  shift
  set -- /usr/bin/nebulafx "$@"
else
  set -- /usr/bin/nebulafx "$@"
fi

# 2) Process data volumes (separate from log directory)
DATA_VOLUMES=""
process_data_volumes() {
  VOLUME_RAW="${NEUBULAFX_VOLUMES:-/data}"
  # Convert comma/tab to space
  VOLUME_LIST=$(echo "$VOLUME_RAW" | tr ',\t' ' ')
  
  for vol in $VOLUME_LIST; do
    case "$vol" in
      /*)
        case "$vol" in
          http://*|https://*) : ;;
          *) DATA_VOLUMES="$DATA_VOLUMES $vol" ;;
        esac
        ;;
      *)
        : # skip non-local paths
        ;;
    esac
  done
  
  echo "Initializing data directories:$DATA_VOLUMES"
  for vol in $DATA_VOLUMES; do
    if [ ! -d "$vol" ]; then
      echo "  mkdir -p $vol"
      mkdir -p "$vol"
      # If target user is specified, try to set directory owner to that user (non-recursive to avoid large disk overhead)
      if [ -n "$NEUBULAFX_UID" ] && [ -n "$NEUBULAFX_GID" ]; then
        chown "$NEUBULAFX_UID:$NEUBULAFX_GID" "$vol" 2>/dev/null || true
      elif [ -n "$NEUBULAFX_USERNAME" ] && [ -n "$NEUBULAFX_GROUPNAME" ]; then
        chown "$NEUBULAFX_USERNAME:$NEUBULAFX_GROUPNAME" "$vol" 2>/dev/null || true
      fi
    fi
  done
}

# 3) Process log directory (separate from data volumes)
process_log_directory() {
  LOG_DIR="${NEUBULAFX_OBS_LOG_DIRECTORY:-/logs}"
  
  echo "Initializing log directory: $LOG_DIR"
  if [ ! -d "$LOG_DIR" ]; then
    echo "  mkdir -p $LOG_DIR"
    mkdir -p "$LOG_DIR"
    # If target user is specified, try to set directory owner to that user (non-recursive to avoid large disk overhead)
    if [ -n "$NEUBULAFX_UID" ] && [ -n "$NEUBULAFX_GID" ]; then
      chown "$NEUBULAFX_UID:$NEUBULAFX_GID" "$LOG_DIR" 2>/dev/null || true
    elif [ -n "$NEUBULAFX_USERNAME" ] && [ -n "$NEUBULAFX_GROUPNAME" ]; then
      chown "$NEUBULAFX_USERNAME:$NEUBULAFX_GROUPNAME" "$LOG_DIR" 2>/dev/null || true
    fi
  fi
}

# Execute the separate processes
process_data_volumes
process_log_directory

# 4) Default credentials warning
if [ "${NEUBULAFX_ACCESS_KEY}" = "nebulafxadmin" ] || [ "${NEUBULAFX_SECRET_KEY}" = "nebulafxadmin" ]; then
  echo "!!!WARNING: Using default NEUBULAFX_ACCESS_KEY or NEUBULAFX_SECRET_KEY. Override them in production!"
fi

# 5) Append DATA_VOLUMES only if no data paths in arguments
# Check if any argument looks like a data path (starts with / and not an option)
HAS_DATA_PATH=false
for arg in "$@"; do
  case "$arg" in
    /usr/bin/nebulafx) continue ;;
    -*) continue ;;
    /*) HAS_DATA_PATH=true; break ;;
  esac
done

if [ "$HAS_DATA_PATH" = "false" ] && [ -n "$DATA_VOLUMES" ]; then
  echo "Starting: $* $DATA_VOLUMES"
  set -- "$@" $DATA_VOLUMES
else
  echo "Starting: $*"
fi

exec "$@"
