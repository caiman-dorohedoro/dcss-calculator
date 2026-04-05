# Version Follow-Ups And Crawl Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two known post-update calculator gaps (`barding` EV and `death ego` Necromancy spell success) and strengthen the maintenance docs so future version refreshes explicitly audit both stable-to-trunk changes and repo-supported old-trunk-to-current-trunk changes from the local Crawl checkout.

**Architecture:** Keep the calculator changes minimal and source-driven. Reproduce the failing cases from the existing regression tests, confirm the exact Crawl behavior in the local `crawl/` checkout, then update only the EV and spell-failure code paths needed for parity. After the code is green, fold the new audit expectations back into the operations docs and the active follow-up notes.

**Tech Stack:** TypeScript, Jest, Markdown docs, local DCSS `crawl/` checkout

---

## File Map

### Modify

- `src/utils/evCalculation.ts`
- `src/utils/spellCalculation.ts`
- `src/utils/__tests__/evCalculations.test.ts`
- `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`
- `docs/operations/crawl-0.34.1-to-trunk-audit.md`
- `docs/operations/versioning-workflow.md`
- `docs/superpowers/plans/2026-04-05-034-trunk-version-update.md`

## Task 1: Reproduce The Known Gaps Against Local Crawl Sources

**Files:**
- Test: `src/utils/__tests__/evCalculations.test.ts`
- Test: `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`

- [x] **Step 1: Run the barding EV regression by itself**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/evCalculations.test.ts
```

Expected:

```text
FAIL src/utils/__tests__/evCalculations.test.ts
Expected: 16
Received: 18
```

- [x] **Step 2: Run the death-ego spell regression by itself**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts
```

Expected:

```text
FAIL src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts
Expected: 9
Received: 61
```

- [x] **Step 3: Confirm the Crawl source rules from the local checkout**

Run:

```bash
rg -n "_player_aux_evasion_penalty|ARM_BARDING|SPARM_DEATH|fail_reduce" \
  /Users/hyeon/playground/dcss-tools-caiman/crawl/crawl-ref/source
```

Expected:

```text
player.cc:_player_aux_evasion_penalty
item-prop.cc: ARM_BARDING ... -60
spl-cast.cc: if (you.wearing_ego(OBJ_ARMOUR, SPARM_DEATH) && spell_typematch(spell, spschool::necromancy))
spl-cast.cc: fail_reduce = fail_reduce / 2
```

## Task 2: Fix EV Parity For Barding Wearers

**Files:**
- Modify: `src/utils/evCalculation.ts`
- Test: `src/utils/__tests__/evCalculations.test.ts`

- [x] **Step 1: Keep the existing gale centaur EV regression as the failing test**

Use the current test in `src/utils/__tests__/evCalculations.test.ts` as the red test. Do not weaken the expectation.

- [x] **Step 2: Implement the minimal auxiliary-armour EV penalty needed for barding**

Update `calculateEV` so it accepts the same `barding` boolean the UI state already carries and subtracts the Crawl-equivalent fixed barding EV penalty from the final EV path without changing spell-failure calculations.

- [x] **Step 3: Re-run the EV test file**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/evCalculations.test.ts
```

Expected:

```text
PASS src/utils/__tests__/evCalculations.test.ts
```

## Task 3: Fix Death-Ego Necromancy Spell Success

**Files:**
- Modify: `src/utils/spellCalculation.ts`
- Test: `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`

- [x] **Step 1: Keep the existing Mneme dump regressions as the failing tests**

Use the existing Necromancy mismatch cases in `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts` as the red tests. Do not convert them to `test.failing`.

- [x] **Step 2: Implement the minimal death-ego spell-success adjustment**

Add an opt-in body-armour ego parameter to the spell-failure calculator and mirror the Crawl behavior only for `death` ego body armour on spells whose schools include `necromancy`, applying the reduction at the same stage as Crawl's `fail_reduce` logic.

- [x] **Step 3: Re-run the death-ego regression file**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts
```

Expected:

```text
PASS src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts
```

## Task 4: Strengthen The Maintenance Audit Rules

**Files:**
- Modify: `docs/operations/crawl-0.34.1-to-trunk-audit.md`
- Modify: `docs/operations/versioning-workflow.md`
- Modify: `docs/superpowers/plans/2026-04-05-034-trunk-version-update.md`

- [x] **Step 1: Re-audit the local Crawl history for version-impacting changes since the repo's previously supported trunk snapshot**

Use the local `crawl/` checkout and the repo's last pre-2026 supported trunk state to confirm whether species, mutations or abilities, items or unrands, spell metadata, and formula-adjacent files changed in ways that future refreshes must inspect explicitly.

- [x] **Step 2: Update the audit doc to distinguish implemented fixes from future watchpoints**

Revise `docs/operations/crawl-0.34.1-to-trunk-audit.md` so the `barding` EV and `death ego` notes stop claiming they are intentionally unfixed, and add a note that future refreshes must also compare the repo's last supported trunk snapshot against the current local Crawl trunk instead of only comparing stable release to current trunk.

- [x] **Step 3: Update the workflow doc to require both audit directions**

Revise `docs/operations/versioning-workflow.md` so future maintenance explicitly includes:

- stable release tag -> current local `crawl/master`
- repo-supported previous trunk snapshot -> current local `crawl/master`
- source review for species, mutation or ability text and code, item base data, unrands, spell metadata, and formula-adjacent files

- [x] **Step 4: Mark the old follow-up plan as superseded where needed**

Update `docs/superpowers/plans/2026-04-05-034-trunk-version-update.md` so it no longer reads like the EV and death-ego gaps are still the intended final state of the branch.

## Task 5: Verify And Report Actual Status

**Files:**
- Test: `src/utils/__tests__/evCalculations.test.ts`
- Test: `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`
- Test: `src/utils/__tests__/spellCalculations.test.ts`
- Test: `src/versioning/__tests__/versionRegistry.test.ts`

- [x] **Step 1: Run the focused follow-up verification**

Run:

```bash
npm test -- --runInBand \
  src/utils/__tests__/evCalculations.test.ts \
  src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts \
  src/utils/__tests__/spellCalculations.test.ts \
  src/versioning/__tests__/versionRegistry.test.ts
```

- [x] **Step 2: Run the build**

Run:

```bash
npm run build
```

- [x] **Step 3: Summarize what is fixed and what still remains**

Call out any residual baseline failures honestly rather than folding them into this bugfix scope.
