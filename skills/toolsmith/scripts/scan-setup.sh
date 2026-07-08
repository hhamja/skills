#!/usr/bin/env bash
# toolsmith deterministic inventory — a census of the agent-engineering surface.
# Feeds step 1 (Inventory) and surfaces step-2 signals (referenced-but-absent,
# template residue). Judgment stays in the skill; this script only counts and finds.
#
# Usage: scan-setup.sh [project-dir]     (default project-dir: current directory)
# Env:   CLAUDE_HOME overrides ~/.claude
#
# Always exits 0 — this is a census, not a gate.
set -u

CLAUDE_DIR="${CLAUDE_HOME:-$HOME/.claude}"
PROJ="${1:-$PWD}"

count() { find "$@" 2>/dev/null | wc -l | tr -d '[:space:]'; }

skills=$(count "$CLAUDE_DIR/skills" -maxdepth 2 -name SKILL.md -type f)
agents=$(count "$CLAUDE_DIR/agents" -maxdepth 1 -name '*.md' -type f)
commands=$(count "$CLAUDE_DIR/commands" -maxdepth 1 -name '*.md' -type f)
mkts=$(count "$CLAUDE_DIR/plugins/marketplaces" -mindepth 1 -maxdepth 1 -type d)
hooks="no"; grep -q '"hooks"' "$CLAUDE_DIR/settings.json" 2>/dev/null && hooks="yes"

echo "== setup surface: $CLAUDE_DIR =="
printf '  personal skills     : %s\n' "$skills"
printf '  custom agents        : %s\n' "$agents"
printf '  custom commands      : %s\n' "$commands"
printf '  plugin marketplaces  : %s\n' "$mkts"
printf '  hooks in settings    : %s\n' "$hooks"
echo

echo "== referenced-but-absent files in: $PROJ =="
missing=0
refs=$(
  for src in "$PROJ"/README.md "$PROJ"/docs "$PROJ"/package.json; do
    [ -e "$src" ] || continue
    grep -rhoE --exclude-dir=node_modules --exclude-dir=.git \
      '(scripts|src|app|packages)/[A-Za-z0-9_./-]+\.(mjs|cjs|js|ts|tsx|sh)' "$src" 2>/dev/null
  done | sort -u
)
if [ -n "$refs" ]; then
  # Flag only when the exact path is absent AND the basename exists nowhere under
  # PROJ — avoids monorepo false positives (e.g. app/main.tsx living in apps/*/).
  while IFS= read -r ref; do
    [ -e "$PROJ/$ref" ] && continue
    base=$(basename "$ref")
    if [ -z "$(find "$PROJ" -name "$base" -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | head -1)" ]; then
      printf '  MISSING: %s\n' "$ref"; missing=$((missing + 1))
    fi
  done <<EOF
$refs
EOF
fi
[ "$missing" -eq 0 ] && echo "  (none found)"
echo

echo "== template residue / manual markers in: $PROJ =="
todos=$(grep -rIoE 'TODO' "$PROJ" --include='*.md' --include='*.ts' --include='*.tsx' --include='*.mjs' \
  --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | wc -l | tr -d '[:space:]')
printf '  TODO markers (md/ts/tsx/mjs): %s\n' "$todos"

exit 0
