# Signal catalog

The five families of productivity gap, with how to detect each and what evidence
to capture. A signal only counts when you can point at concrete evidence (a path,
a line, a repeated step). No evidence → not a signal.

---

## 1. Repeated manual step

A human does the same thing every unit of work (per app, per PR, per release).

**Detect**
- Read the project's workflow docs (e.g. `docs/*WORKFLOW*.md`, `docs/*CHECKLIST*.md`, `SETUP.md`). List every step a human performs by hand.
- Ask: "which of these happens on *every* app/PR/release?" Recurrence is the tell.
- Look for prose checklists that a human ticks off — those are un-automated procedures.

**Evidence**: the doc path + the step text + the recurrence unit ("every app").

**Typical fix**: script (if fully deterministic), slash command (if a fixed multi-step flow), or a rubric criterion (if it's really a check).

---

## 2. Human-judged goal that a command could grade

A "done" defined by human eyeballing where a machine check exists or could.

**Detect**
- In goals/rubrics/PRDs, flag criteria worded subjectively: "looks good", "works", "is clean", "feels fast".
- Ask for each: "what command, exit code, file, or output substring would prove this?" If one exists, the human check is waste.
- Watch for behavior asserted in prose but not covered by a test.

**Evidence**: the criterion text + the concrete check that could replace it.

**Typical fix**: rubric criterion with a `verify:` command; or a test (behavior); or a hook (enforce continuously).

---

## 3. Referenced-but-absent tooling

A file, script, or template that docs/config point at but that does not exist.

**Detect**
- `scripts/scan-setup.sh` prints `MISSING:` lines — path-like references in docs/README/package.json with no file on disk.
- Grep docs for named artifacts ("run `scripts/foo.mjs`", "fill `docs/BAR-template.md`") and check existence.
- Note anything a doc calls "the heart / core, currently empty" — self-identified gaps are gold.

**Evidence**: the referencing path + the missing target path.

**Typical fix**: build the named artifact (usually a script or context pack). Highest-confidence candidates — the need is already documented.

---

## 4. Context-heavy read a script could replace

The agent burns main-context tokens re-reading/parsing the same thing to decide something deterministic.

**Detect**
- Look for "read all of X to compute Y" where Y is countable/parseable (counts, sums, presence, matches).
- Recurring broad reads at the start of a task that produce a small factual answer.
- Determinism test: could `awk`/`grep`/`find` produce the same answer? Then it belongs in a script.

**Evidence**: what's read + the deterministic answer wanted.

**Typical fix**: script (emit the fact); or delegate the read to a cheap read-only scout agent so it stays out of main context.

---

## 5. Verification hole

The pipeline checks *wiring/structure* but not *behavior* — or a whole class of output is ungraded.

**Detect**
- Compare what the rubric/gates assert against what could break. Gaps = holes.
- Classic tell: structure is checked (files exist, imports wired) but no test runs the code. Look for `test: TODO` / absent test gate.
- Ask: "what could regress and no check would catch it?"

**Evidence**: the unguarded behavior + where a check would live.

**Typical fix**: test + rubric criterion that runs it; sometimes a hook to keep it enforced.

---

## Scoring inputs (for step 5 ranking)

- **Frequency** — per app/PR/release vs one-off.
- **Time saved** — minutes-per-occurrence × frequency.
- **Automatability** — fully deterministic (script/hook) beats judgment-heavy (skill/subagent) for confidence.
- Prefer candidates whose "done" is a single command exiting 0.
