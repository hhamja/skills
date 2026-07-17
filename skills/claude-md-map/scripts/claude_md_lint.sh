#!/usr/bin/env bash
# PostToolUse(Write|Edit) lint: CLAUDE.md / AGENTS.md must stay a map, not an encyclopedia.
# Exit 2 feeds the message back to Claude so it fixes the file in place.
set -u

MAX_LINES=120

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -n "$file" ] || exit 0
base=$(basename "$file")
case "$base" in CLAUDE.md | AGENTS.md) ;; *) exit 0 ;; esac
[ -f "$file" ] || exit 0

errors=""

lines=$(wc -l <"$file" | tr -d ' ')
if [ "$lines" -gt "$MAX_LINES" ]; then
  errors+="- $base is $lines lines (max $MAX_LINES). A map, not an encyclopedia: move detail into docs/ or a skill, link to it from here, and keep the most important rules first."$'\n'
fi

# Relative markdown links must resolve — a map with broken pointers misleads.
dir=$(dirname "$file")
broken=""
while IFS= read -r link; do
  case "$link" in
  *://* | \#* | /* | mailto:*) continue ;;
  esac
  target="${link%%#*}"   # drop anchor
  target="${target%% \"*}" # drop "title"
  [ -n "$target" ] || continue
  [ -e "$dir/$target" ] || broken+="    $link"$'\n'
done < <(grep -oE '\]\([^)]+\)' "$file" 2>/dev/null | sed -E 's/^\]\(//; s/\)$//')

if [ -n "$broken" ]; then
  errors+="- Broken relative links (fix the path or create the target):"$'\n'"$broken"
fi

if [ -n "$errors" ]; then
  {
    echo "claude_md_lint: $file violates the map principle."
    printf '%s' "$errors"
    echo "Fix it now. Criteria and workflow: the claude-md-map skill (SKILL.md)"
  } >&2
  exit 2
fi
exit 0
