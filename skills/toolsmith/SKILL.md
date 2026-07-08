---
name: toolsmith
description: 에이전트 엔지니어링 셋업과 대상 프로젝트를 감사해 반복 수작업·빠진 machine-check·referenced-but-absent 도구를 찾고, 도구/스킬/커맨드/훅/스크립트 후보를 machine-checkable '완료' 정의와 함께 순위 리포트로 낸다. 생산성 갭 점검·도구 후보 발굴·셋업 자가진단을 원할 때 사용.
---

# Toolsmith

An audit finds where an agent-engineering setup wastes human or agent effort and turns each gap into a concrete, buildable artifact carrying a machine-checkable acceptance test. The deliverable is a ranked report **on disk** — not chat — so the next session can act on it.

## Scope the audit

Two surfaces. The **setup**: `~/.claude/{skills,agents,commands,hooks}`, `settings.json`, installed plugins, MCP servers. One **target project**: its workflow docs, scripts, loop config, and the steps a human repeats per unit of work (per app, per PR, per release). If the project is unstated, ask which one.

## Procedure

1. **Inventory.** Run `scripts/scan-setup.sh <project-dir>` for a deterministic census (skill/agent/command counts, referenced-but-absent files, residue). For broad codebase reading delegate to a read-only `Explore` agent — keep main context lean. Never grade from memory; read the files.
2. **Detect signals.** Walk `references/signal-catalog.md` and mark every hit. Five families: repeated manual steps, human-judged goals a command could grade, referenced-but-absent tooling, context-heavy reads a script could replace, verification holes (wiring checked but behavior not).
3. **Map to artifact.** For each signal pick the right form — skill / subagent / command / hook / script / rubric / context pack / MCP — using `references/artifact-types.md`. One signal → one artifact type; justify the choice.
4. **Define "done".** Give each candidate an acceptance test a machine can run: a command that exits 0, a file that must exist, an output that must match. A candidate without one is not ready — say so, don't invent a vague one.
5. **Rank.** Score by frequency × time-saved × automatability. Flag each as one-shot-scriptable or judgment-heavy. Cut anything you can't tie to a real, observed cost.
6. **Emit.** Write the report to disk (default `<project>/docs/SETUP-AUDIT.md`; confirm the path first). Never leave it only in chat.

## Report shape

A ranked list. Each row: signal (with evidence path) → artifact type → why → machine-checkable "done" → leverage score. Close with a "build next" top 3.

## When to read references/

- Detecting or classifying a gap → `references/signal-catalog.md`
- Choosing skill vs subagent vs command vs hook vs script vs rubric vs MCP → `references/artifact-types.md`

## Discipline

Recommend only what maps to an observed cost — no speculative tooling. The maker of a candidate must not be its own grader: every "done" is an independent check, never "looks good". Do not build the artifacts in this pass — the audit's job is the ranked, buildable list, nothing more.
