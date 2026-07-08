# Artifact types — choosing the right form

A detected signal (from `signal-catalog.md`) becomes a candidate only once you've
chosen *what kind of thing* to build. Pick one type per signal. The decisive
question is **who acts and how often**, not "what's cleanest".

## Decision order

Ask these in order; take the first that fits:

1. **Fully deterministic answer/action?** → **script**. If a command can produce the fact or do the work with no judgment, it's a script. Cheapest, most verifiable.
2. **Must it run automatically on an event** (every save, commit, Stop, tool call)? → **hook**. Hooks are the *only* way to make "always do X when Y" actually happen — the harness runs them, not the model.
3. **A fixed multi-step flow a human kicks off by name?** → **slash command**. A repeatable entry point ("do this whole procedure now").
4. **Reusable method/knowledge the model should apply across many tasks?** → **skill**. Judgment-heavy, progressive-disclosure, triggered by description.
5. **A bounded investigation better run in fresh/parallel context?** → **subagent**. Read-only scouting (explorer) or independent grading (verifier) — keeps main context lean and separates maker from checker.
6. **A machine-checkable "done" for a goal?** → **rubric criterion** (with a `verify:` command). Not a tool — a stop condition.
7. **Reusable context the agent needs loaded** (spec/PRD template, domain canon, style guide)? → **context pack** (a template or `references/` doc).
8. **Capability that needs an external service** (App Store, RevenueCat, EAS, a DB, a browser)? → **MCP server / connector**.

## Quick reference

| Signal shape | Usual artifact |
|---|---|
| Same deterministic step every time | script |
| "Always do X on event Y" | hook |
| "Run this whole procedure now" | slash command |
| Judgment applied across many tasks | skill |
| Broad read / independent grade | subagent |
| Subjective "done" → objective check | rubric criterion |
| Same context re-supplied by hand | context pack / template |
| Needs an external service | MCP connector |

## Anti-patterns

- **Skill where a script suffices.** If no judgment is involved, a prompt is the wrong tool — write the script.
- **Memory/preference where a hook is required.** "From now on, when X…" cannot be a note the model must remember; it must be a hook the harness enforces.
- **Command that duplicates a skill's trigger.** If the model should reach for it contextually, it's a skill; a command is for explicit human invocation.
- **Maker grading itself.** If the artifact both produces and judges the output, split it — the checker (subagent/rubric/hook) must be independent.
- **One-off abstraction.** Used once → inline it. Don't build a configurable tool for a single caller.

## Notes on graduation (where the built artifact lives)

- General-purpose skill/command → the `minseok-skills` plugin.
- Loop/contract/scaffold concern → the `loopkit` plugin.
- Project-specific script/rubric/context pack → in that project's repo.
- Personal, not-yet-distributable → `~/.claude/` (dotfiles-tracked).
