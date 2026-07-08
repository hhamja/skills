# Changelog

All notable changes to this plugin are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project adheres to SemVer.

## [0.1.0] — 2026-07-08

### Added
- Initial plugin scaffold: self-marketplace, budget proof (`scripts/check_budget.sh`).
- `toolsmith` skill — audits an agent-engineering setup and a target project, then
  emits a ranked report of tool/skill/command/hook/script candidates, each with a
  machine-verifiable "done" definition. Ships `references/signal-catalog.md`,
  `references/artifact-types.md`, and `scripts/scan-setup.sh`.
