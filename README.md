# minseok-skills

> A personal, general-purpose **skill collection** for [Claude Code](https://www.anthropic.com/claude-code) — the distribution channel for agent-engineering productivity tools, packaged as an installable plugin.

**English** · [한국어](README.ko.md)

![version](https://img.shields.io/badge/version-0.1.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-8A63D2)

This plugin is the home for reusable, **general-purpose** skills — as opposed to
[`loopkit`](https://github.com/hhamja/loopkit), which is scoped to loop
engineering. A skill "graduates" here once it's mature enough to distribute:
versioned by git tag + `plugin.json` SemVer + `CHANGELOG.md`.

## Skills

| Skill | What it does |
|---|---|
| **`toolsmith`** | Audits an agent-engineering setup and a target project, then emits a ranked report of tool/skill/command/hook/script candidates — each with a machine-verifiable "done" definition. |

## Install

```
/plugin marketplace add hhamja/minseok-skills
/plugin install minseok-skills@minseok-skills
```

(For local development, point the marketplace at the working copy:
`/plugin marketplace add ~/develop/minseok-skills`.)

## Conventions

Skills follow the loop-harness house style:

- **Progressive disclosure** — a thin always-loaded `SKILL.md` that routes to
  `references/*.md` for deep material.
- **Machine-verifiable "done"** — every recommendation carries an acceptance
  test (a command that exits 0, a file that exists, an output that matches).
- **Determinism in scripts, judgment in prompts** — counting, scanning, and
  parsing live in `scripts/*.sh`, not in the prompt.
- **Token budget** — `scripts/check_budget.sh` enforces resident surface
  ≤ 300 words and each `SKILL.md` body ≤ 500 words (exit-code gated).

## Testing

```
bash scripts/check_budget.sh    # budget proof — must exit 0
```

## License

MIT — see [LICENSE](LICENSE).
