#!/usr/bin/env bash
# Interactive Taskfile runner — ↑/↓ or w/s to move, Enter to run, q to quit.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [ -f /volume1/Environments/use-menv.sh ]; then
  # shellcheck disable=SC1091
  . /volume1/Environments/use-menv.sh >/dev/null 2>&1 || true
fi

if ! command -v task >/dev/null 2>&1; then
  echo "task: command not found (install: https://taskfile.dev)" >&2
  exit 1
fi

# ── Pick the environment once; every task launched from the menu inherits it via $ENV ──
announce_environment() {
  if [ "$ENV" = "secure" ]; then
    printf '\n  → ENV=secure  (docker-compose.yml · attach nfx-edge)\n\n'
  else
    printf '\n  → ENV=dev     (docker-compose.dev.yml · attach nfx-edge)\n\n'
  fi
}

choose_environment() {
  case "${ENV:-}" in
    dev | secure)
      export ENV
      announce_environment
      return
      ;;
  esac
  local choice
  printf '\n  NFX-Storages — select environment\n'
  printf '    [D]ev     docker-compose.dev.yml · nfx-edge\n'
  printf '    [S]ecure  docker-compose.yml     · nfx-edge\n'
  printf '  Choice [D/s]: '
  IFS= read -r choice || choice=""
  case "$choice" in
    "" | d | D | dev) ENV=dev ;;
    s | S | secure) ENV=secure ;;
    *)
      echo "Invalid choice: ${choice} (expected dev|secure)" >&2
      exit 1
      ;;
  esac
  export ENV
  announce_environment
}
choose_environment

MENU_EXCLUDE="${TASK_MENU_EXCLUDE:-start}"

readarray -t TASK_ROWS < <(
  task --list-all --json | python3 -c "
import json, sys

exclude = '${MENU_EXCLUDE}'.split(',')
exclude = {x.strip() for x in exclude if x.strip()}

for t in sorted(json.load(sys.stdin)['tasks'], key=lambda x: x['name']):
    name = t['name']
    if name in exclude:
        continue
    desc = (t.get('desc') or '').replace('\n', ' ').strip()
    print(f'{name}\t{desc}')
"
)

if [ "${#TASK_ROWS[@]}" -eq 0 ]; then
  echo "No tasks found in Taskfile.yml" >&2
  exit 1
fi

TASK_NAMES=()
TASK_DESCS=()
for row in "${TASK_ROWS[@]}"; do
  TASK_NAMES+=("${row%%$'\t'*}")
  TASK_DESCS+=("${row#*$'\t'}")
done

SELECTED=0
COUNT=${#TASK_NAMES[@]}

# ANSI colors (disabled when stdout is not a TTY)
if [ -t 1 ]; then
  C_RST=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_DIM=$'\033[2m'
  C_TITLE=$'\033[1;36m'
  C_HINT=$'\033[2;37m'
  C_LINE=$'\033[90m'
  C_ARROW=$'\033[1;32m'
  C_SEL_NAME=$'\033[1;96m'
  C_SEL_DESC=$'\033[33m'
  C_NAME=$'\033[37m'
  C_DESC=$'\033[2;90m'
  C_FOOTER=$'\033[2;36m'
  C_RUN=$'\033[1;32m'
else
  C_RST= C_BOLD= C_DIM= C_TITLE= C_HINT= C_LINE=
  C_ARROW= C_SEL_NAME= C_SEL_DESC= C_NAME= C_DESC= C_FOOTER= C_RUN=
fi

cleanup() {
  tput cnorm 2>/dev/null || true
  tput clear 2>/dev/null || clear
}
trap cleanup EXIT INT TERM

read_key() {
  local key seq
  IFS= read -rsn1 key || return 1
  case "$key" in
    $'\x1b')
      IFS= read -rsn2 -t 0.01 seq || true
      case "$seq" in
        '[A') printf 'up' ;;
        '[B') printf 'down' ;;
        *) printf 'esc' ;;
      esac
      ;;
    ''|$'\n'|$'\r') printf 'enter' ;;
    [wWkK]) printf 'up' ;;
    [sSjJ]) printf 'down' ;;
    [qQ]) printf 'quit' ;;
    *) printf 'other' ;;
  esac
}

# Truncate to a single terminal line; overflow becomes "...".
truncate_line() {
  local s="$1" max="$2"
  if [ "$max" -le 0 ]; then
    printf ''
    return
  fi
  if [ "${#s}" -le "$max" ]; then
    printf '%s' "$s"
    return
  fi
  if [ "$max" -le 3 ]; then
    printf '%s' "${s:0:$max}"
    return
  fi
  printf '%s...' "${s:0:$((max - 3))}"
}

draw_menu() {
  local i name desc cols rows width name_max desc_budget desc_part
  local header_lines=3 footer_lines=2 view_h focus offset start end scroll_hint

  cols="$(tput cols 2>/dev/null || echo 80)"
  rows="$(tput lines 2>/dev/null || echo 24)"
  # Keep 1 column free so the terminal never wraps a row.
  width=$((cols > 24 ? cols - 1 : 76))
  name_max=28
  # " ▶ " / "   " (3) + name + " — " (3)
  desc_budget=$((width - 3 - name_max - 3))
  if [ "$desc_budget" -lt 0 ]; then
    desc_budget=0
  fi

  view_h=$((rows - header_lines - footer_lines))
  if [ "$view_h" -lt 3 ]; then
    view_h=3
  fi
  if [ "$view_h" -gt "$COUNT" ]; then
    view_h=$COUNT
  fi

  # Keep the ▶ cursor on a fixed screen row (middle); list scrolls under it.
  # Near the ends of the list the cursor must move — unavoidable.
  focus=$((view_h / 2))
  if [ "$COUNT" -le "$view_h" ]; then
    offset=0
  else
    offset=$((SELECTED - focus))
    if [ "$offset" -lt 0 ]; then
      offset=0
    fi
    if [ "$offset" -gt $((COUNT - view_h)) ]; then
      offset=$((COUNT - view_h))
    fi
  fi
  start=$offset
  end=$((offset + view_h))

  tput civis 2>/dev/null || true
  tput clear 2>/dev/null || clear

  printf '%sNFX-Storages Task Runner%s %s[%s]%s  %s(↑/↓ or w/s · Enter run · q quit)%s\n' \
    "$C_TITLE" "$C_RST" "$C_BOLD" "${ENV}" "$C_RST" "$C_HINT" "$C_RST"
  printf '%s%s%s\n\n' "$C_LINE" "$(printf '─%.0s' $(seq 1 "$width"))" "$C_RST"

  for ((i = start; i < end; i++)); do
    name="$(truncate_line "${TASK_NAMES[$i]}" "$name_max")"
    desc="${TASK_DESCS[$i]}"
    desc_part=""
    if [ -n "$desc" ] && [ "$desc_budget" -gt 0 ]; then
      desc_part="$(truncate_line "$desc" "$desc_budget")"
    fi

    if [ "$i" -eq "$SELECTED" ]; then
      if [ -n "$desc_part" ]; then
        printf ' %s▶%s %s%-*s%s %s—%s %s%s%s\n' \
          "$C_ARROW" "$C_RST" \
          "$C_SEL_NAME" "$name_max" "$name" "$C_RST" \
          "$C_DIM" "$C_RST" \
          "$C_SEL_DESC" "$desc_part" "$C_RST"
      else
        printf ' %s▶%s %s%s%s\n' \
          "$C_ARROW" "$C_RST" "$C_SEL_NAME" "$name" "$C_RST"
      fi
    else
      if [ -n "$desc_part" ]; then
        printf '   %s%-*s%s %s—%s %s%s%s\n' \
          "$C_NAME" "$name_max" "$name" "$C_RST" \
          "$C_DIM" "$C_RST" \
          "$C_DESC" "$desc_part" "$C_RST"
      else
        printf '   %s%s%s\n' "$C_NAME" "$name" "$C_RST"
      fi
    fi
  done

  scroll_hint=""
  if [ "$start" -gt 0 ] || [ "$end" -lt "$COUNT" ]; then
    scroll_hint="  "
    if [ "$start" -gt 0 ]; then
      scroll_hint+="↑"
    else
      scroll_hint+=" "
    fi
    if [ "$end" -lt "$COUNT" ]; then
      scroll_hint+="↓"
    else
      scroll_hint+=" "
    fi
  fi
  printf '\n%s%d / %d%s%s%s%s\n' \
    "$C_FOOTER" "$((SELECTED + 1))" "$COUNT" "$C_RST" \
    "$C_HINT" "$scroll_hint" "$C_RST"
}

while true; do
  draw_menu
  key="$(read_key || echo quit)"

  case "$key" in
    up)
      SELECTED=$(( (SELECTED - 1 + COUNT) % COUNT ))
      ;;
    down)
      SELECTED=$(( (SELECTED + 1) % COUNT ))
      ;;
    enter)
      name="${TASK_NAMES[$SELECTED]}"
      cleanup
      trap - EXIT INT TERM
      printf '%sExtra args for %s (optional, passed after --; Enter to skip):%s ' \
        "$C_HINT" "$name" "$C_RST"
      IFS= read -r EXTRA_ARGS || EXTRA_ARGS=""
      if [ -n "$EXTRA_ARGS" ]; then
        echo "${C_RUN}→ ENV=${ENV} task ${name} -- ${EXTRA_ARGS}${C_RST}"
        echo
        # shellcheck disable=SC2086
        exec task "$name" -- $EXTRA_ARGS
      else
        echo "${C_RUN}→ ENV=${ENV} task ${name}${C_RST}"
        echo
        exec task "$name"
      fi
      ;;
    quit|esc)
      cleanup
      trap - EXIT INT TERM
      exit 0
      ;;
  esac
done
