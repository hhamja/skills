# Changelog

All notable changes to this plugin are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project adheres to SemVer.

## [0.4.0] — 2026-07-17

### Added
- `claude-md-map` skill — reviews or (re)writes a CLAUDE.md/AGENTS.md so it
  works as a map, not an encyclopedia: 7 pass/fail criteria (most-important
  first, pointers over prose, load-bearing rules only) plus a restructure
  workflow that relocates depth into docs/skills instead of deleting it.
  Ships `scripts/claude_md_lint.sh` (120-line cap + relative-link resolution;
  exit-2 PostToolUse hook that feeds violations back for in-place fixes).

## [0.3.0] — 2026-07-13

### Added
- `official-plugins` skill — surveys the official Claude Code plugin marketplace
  (`anthropics/claude-plugins-official`) and reports, per plugin: author,
  description, and whether it is Anthropic-authored or an external
  (vendor/community) contribution. Origin is derived from the catalog `source`
  field (`./plugins/` = Anthropic, `./external_plugins/` and `git-subdir` =
  external), since ~1/3 of entries declare no author. Ships
  `scripts/survey.mjs` (live-catalog fetch, filters, JSON, offline `--file`,
  and a `--selfcheck` classifier assertion).

## [0.2.0] — 2026-07-10

### Added
- `niche-finder` skill — finds narrow app niches where *you* hold an unfair
  distribution edge, using free App Store signals only (iTunes Search API,
  review RSS). Emits ranked, testable hypotheses — never "validated demand".
  Ships `references/output-schema.md`, `scripts/aso-probe.mjs` (signal
  fetcher), and `scripts/aso-verify.mjs` (independent checker that re-queries
  live APIs to block fabricated numbers/quotes; Apple 4.3 duplicate guard).

## [0.1.0] — 2026-07-08

### Added
- Initial plugin scaffold: self-marketplace, budget proof (`scripts/check_budget.sh`).
- `toolsmith` skill — audits an agent-engineering setup and a target project, then
  emits a ranked report of tool/skill/command/hook/script candidates, each with a
  machine-verifiable "done" definition. Ships `references/signal-catalog.md`,
  `references/artifact-types.md`, and `scripts/scan-setup.sh`.
