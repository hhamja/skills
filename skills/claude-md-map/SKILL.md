---
name: claude-md-map
description: Review or (re)write a CLAUDE.md/AGENTS.md so it works as a map, not an encyclopedia. Use when creating a CLAUDE.md or AGENTS.md, substantially editing one, or when the user asks to review, trim, or restructure an instruction file (e.g. "지도로 만들어줘", "CLAUDE.md 검토/다듬어").
---

# CLAUDE.md as a Map

A top-level instruction file is a map: a short, stable entry point that says **where to look**, not what everything is. A bundled lint (`scripts/claude_md_lint.sh` — optionally install as a PostToolUse(Write|Edit) hook) enforces the hard limits (120 lines, links resolve); this skill covers what a lint can't check.

## Criteria

Grade each pass/fail with evidence:

1. **≤ ~100 lines** (hook blocks at 120). Depth belongs in `docs/` or a skill, linked from here.
2. **Most important first** — if the file were truncated, the surviving top must still carry the critical rules.
3. **Only what can't be inferred from the code** — for each line ask: "would removing this cause a mistake?" If not, cut it.
4. **Pointers over prose** — a section of explanation becomes a linked doc plus a one-line hook here ("before changing X, read Y").
5. **Occasionally-needed knowledge → a Skill**, loaded on demand, not resident in every context window.
6. **Rules must be load-bearing** — each rule is either mechanically enforced (CI, hook — name the check command) or demonstrably prevents a known mistake. Aspirational rules rot.
7. **Links resolve** — every relative link points at an existing file (hook enforces).

## Workflow

1. Read the target file; `ls` the repo root to see where depth can live (`docs/`, `skills/`, `README`).
2. Grade criteria 1–7.
3. Propose the restructure: what stays, what moves where (name the destination file), what gets cut. Moving content means creating/updating the destination, not deleting knowledge.
4. Apply. Preserve rule meanings — this is relocation and compression, not policy rewriting.
5. Verify mechanically:
   `echo "{\"tool_input\":{\"file_path\":\"$PWD/CLAUDE.md\"}}" | bash <this skill's>/scripts/claude_md_lint.sh` → exit 0.

## Shape that works

Title + one-line what-this-is (point to README for the rest) → hard rules with their check commands → structure table (where things live, one line each) → deep-doc pointers with "read this before X" notes.
