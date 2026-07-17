---
name: github-search
description: Survey a software/tool landscape without missing things — live open discovery over GitHub (topic/text/trending search, never a from-memory candidate list), live star measurement via the API, star-inflation skepticism, and vendor-reported vs independent-adoption separation across multiple ranking axes. Use when asked which tools/libraries/agents/frameworks exist in a category, which to pick, or to compare a space.
argument-hint: [topic/category] [--deep]
---

# github-search — survey a tool landscape without missing things

Discovery must come from live open search, not from what you already know by name. The failure mode this skill prevents: querying a hand-remembered candidate list, ranking by raw stars, and repeating vendor marketing as fact.

Topic (`$ARGUMENTS`): the category to survey (e.g. "Claude Code harnesses", "vector DBs"). `--deep` adds a deep multi-source adoption pass.

## Procedure

1. **Open discovery first — never a memory list.** Run live GitHub search; do NOT start from repos you already know. Several angles, each sorted by stars:
   ```
   curl -sL "https://api.github.com/search/repositories?q=topic:<topic>&sort=stars&order=desc&per_page=30"
   curl -sL "https://api.github.com/search/repositories?q=<terms>+in:name,description&sort=stars&order=desc&per_page=30"
   ```
   Also scan `github.com/trending` for the category. Names you already know only *supplement* this — they never replace it. Anything created after your knowledge cutoff is invisible to memory; open search is the only way to catch it.

2. **Measure live; follow redirects; flag the dead.** For each candidate: `curl -sL ".../repos/<owner>/<repo>"` → read `stargazers_count`, `pushed_at`, `archived`, `full_name` (a redirect = a rename; stars carry over). Mark `archived:true`, or `pushed_at` older than ~3 months, as dead/stale.

3. **Judge by substance, not stars.** Star counts in hot ecosystems are heavily inflated — a single-purpose repo can carry 50k+ stars while being ~97% non-functional stub. Never rank by stars alone. Rank by: provenance (who made it — credible?), maintenance (recent commits, contributor count), what it *actually installs/does*, and independent audits. For any suspiciously high-star repo, also search `"<repo> audit OR review OR criticism"` for the contrarian read.

4. **Separate vendor from independent; add the closed players.** Closed products (often the real market leaders) have no star signal — add them from knowledge and label "closed / vendor-reported". Tag every number as vendor-self-reported or independent-survey. Never present vendor marketing as adoption fact.

5. **Cross-axis ranking — surface the divergence.** Rank on at least: (a) GitHub stars, (b) independent adoption surveys, (c) vendor-reported scale. They usually disagree, and the disagreement is the insight (the star leader is often absent from real-usage surveys). Show the axes side by side.

6. **`--deep` (optional).** If a `deep-research` workflow/skill is available, run it for verified adoption numbers (`Workflow({name:"deep-research", args:"<topic> — adoption, independent vs vendor data, live GitHub stars"})`); otherwise do a manual multi-source `WebSearch` + fetch pass. Fold results into the tables.

## Output

Ranked table(s) with live stars + last-push + status; a separate closed-products table; the cross-axis divergence table; and a per-use-case verdict. Stars are shown as data, never as the verdict. State the measurement date — stars move fast.
