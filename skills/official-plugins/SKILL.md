---
name: official-plugins
description: Survey the official Claude Code plugin marketplace (anthropics/claude-plugins-official) — who authored each plugin, what it does, and whether it is Anthropic-made or an external contribution. Use when asked which plugins are official/Anthropic-made, who maintains a plugin, or to audit the marketplace.
---

# Official Plugins

**Purpose:** Answer "which Claude Code plugins are actually made by Anthropic, who authored each, what does it do, and which are external contributions?" — by surveying the catalog that Claude Code itself reads.

## Key fact (do not skip)

Being listed in `anthropics/claude-plugins-official` does **not** mean Anthropic wrote the plugin. The official repo is a curated *distribution channel*; most entries are third-party (vendor / community) contributions. A missing `author` field is common and always means external — never Anthropic.

## How origin is decided

The catalog's `source` field is the reliable discriminator (author is often null):

| `source` value | Origin | Hosting |
|---|---|---|
| `./plugins/...` | Anthropic-authored | vendored in repo |
| `./external_plugins/...` | External | vendored in repo |
| `{ source: "git-subdir", url }` | External | pulled from vendor's own repo |

## Procedure

1. Run the survey (fetches the live catalog; no auth or keys needed):
   - `node scripts/survey.mjs` — summary + grouped one-line report
   - `node scripts/survey.mjs --origin anthropic` — only Anthropic-made
   - `node scripts/survey.mjs --origin external` — only external contributions
   - `node scripts/survey.mjs --filter <text>` — match name / author / category / description
   - `node scripts/survey.mjs --desc` — add each plugin's full description
   - `node scripts/survey.mjs --json` — structured output for further processing
   - `node scripts/survey.mjs --file <path>` — read a local catalog copy (offline)
2. Report back with: **author**, **description**, **origin** (Anthropic vs External), and — for external plugins — the source repo shown in the row tag.
3. For a question about one specific plugin, filter to it and state author + origin + hosting explicitly. If `author` shows `—` (null in the catalog), say so: the real author lives in that plugin's own manifest/repo, which this catalog does not carry.

## Caveats

- Counts drift as the marketplace changes — always run the script, never quote from memory.
- Null author ≠ Anthropic. Every Anthropic plugin declares `author: "Anthropic"`; a missing author is always external.
- The script only reads the catalog; it does not clone external repos, so it cannot recover a vendor's self-declared name for a null-author entry. Report such authors as undeclared.

## Verify

`node scripts/survey.mjs --selfcheck` — asserts the origin classifier against fixtures (exit 0 = OK). Run it after editing the script.
