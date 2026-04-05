# Crawl 0.34.1 To Trunk Audit

## Baselines

- Audit date: `2026-04-05`
- Stable source: `crawl` tag `0.34.1` at `381d86c47a17a7f29770cf5e6f7bd9b60642aab6`
- Trunk source: local `/Users/hyeon/playground/dcss-tools-caiman/crawl` checkout, treating `crawl/master` as `origin/master`
- Local trunk head used for diffs: `f9e06672e492112214d3eb06629e27c47ed457ff` (`2026-04-05`)
- GitHub compare API: `https://api.github.com/repos/crawl/crawl/compare/0.34.1...master`

## Compare API Snapshot

- `status=diverged`
- `ahead_by=258`
- `behind_by=102`
- `total_commits=258`
- `commits_returned=250`
- `files_returned=300`
- `first_file=.github/workflows/ci.yml`
- API head matched the local `crawl/master` head: `f9e06672e492112214d3eb06629e27c47ed457ff`

The compare payload was useful for the baseline and current head, but not complete enough for a full audit because GitHub truncated the commit list to 250 entries and the file list to 300 entries. The detailed findings below were verified against the local `crawl/master` checkout.

## Directly Reflected In This Calculator Update

- The app now treats `0.34` as the stable release baseline and trunk as the current development snapshot, using `0.34.1` for the stable spell header and the local `crawl/master` spell header for trunk.
- Trunk spell metadata includes two visible name and identifier changes in `crawl-ref/source/spl-data.h`:
  - `SPELL_SUMMON_UFETUBUS` / `Summon Ufetubus` -> `SPELL_UFETUBI_SWARM` / `Ufetubi Swarm`
  - `SPELL_WALL_OF_BRAMBLES` / `Wall of Brambles` -> `SPELL_CAGE_OF_BRAMBLES` / `Cage of Brambles`
- `Cage of Brambles` also changed spell metadata, dropping `spschool::conjuration` and becoming `spschool::earth` only. That change is carried automatically by the refreshed spell snapshot.
- Species handling needs to stay version-aware:
  - `0.34.1` still ships `crawl-ref/source/dat/species/armataur.yaml`
  - trunk ships `crawl-ref/source/dat/species/gale-centaur.yaml`
  - trunk also keeps `crawl-ref/source/dat/species/deprecated-armataur.yaml` for compatibility
- The trunk species lineage and mutation naming moved from Armataur and `MUT_ROLLPAGE` toward Gale Centaur and `MUT_STAMPEDE`, so version-aware species traits remain the right boundary for calculator support instead of hardcoded string checks.

## Audit-Only Findings / Follow-Up Candidates

### Species And Mutation Changes Observed

- Local history confirms the lineage:
  - `e12fab6a22f` `Replace Armataurs with Anemocentaurs`
  - `c80f6e2a8de` `Rename Anemocentaur to Gale Centaur`
  - `15775b53b19` `Move Gale Centaur to Advanced`
- `0.34.1` Armataur data includes `MUT_ROLLPAGE`, `MUT_ARMOURED_TAIL`, and `MUT_DEFORMED`.
- trunk Gale Centaur data includes `MUT_STAMPEDE`, `MUT_HOOVES`, and `MUT_DEFORMED`.
- trunk `deprecated-armataur.yaml` keeps the old species entry for save compatibility, but also swaps the old Armataur passive to `MUT_STAMPEDE`.
- `crawl-ref/source/mutation-data.h` renamed the mutation entry from `rollpage` to `stampede` and rewrote the text around the effect.
- `crawl-ref/source/mutation-data.h` also added the Four Winds mutation set:
  - `MUT_NORTH_WIND`
  - `MUT_SOUTH_WIND`
  - `MUT_WEST_WIND`
  - `MUT_EAST_WIND`
- The mutation data now includes the text `One of the Four Winds will empower you as you Stampede.`

### Item And Unrand Changes Observed

- Local history confirms the item and unrand changes:
  - `81124d88450` `New short blade base type: Athame`
  - `652d35cfb02` `Rework Zephyr`
  - `4be80ac0e20` `Rename Amulet of the Four Winds to Amulet of Tranquility`
  - `2d801cba1d9` `New unrand: the swamp witch's dragon scales`
  - `e17ad08588a` `Change the glaive of Prune to the partisan of Prune`
- `player-equip.cc` adds explicit `WPN_ATHAME` equip handling, and `crawl-ref/source/art-data.txt` introduces the new unrand `swamp witch's dragon scales`.
- `Zephyr` was reworked in `crawl-ref/source/art-data.txt`:
  - `PLUS` changed from `+8` to `+12`
  - the artifact moved from `BRAND: SPWPN_SPEED` to `FB_BRAND: SPWPN_SPEED`
  - it gained `INSCRIP: Salvo`
  - its description brand text now says it can also shoot up to four other unobstructed targets in range
  - `DEX` changed from `3` to `5`
  - `BOOL` changed from `seeinv` to `fly`
- `glaive of Prune` became `partisan of Prune` in both artifact data and unrand description text.
- `amulet of the Four Winds` became `amulet of Tranquility` in both artifact data and unrand description text.

These changes were audited for future calculator scope, but this task does not expand local equipment, species, or unrand modeling beyond the mechanics already implemented.

## Formula-Adjacent Files Checked

- `crawl-ref/source/spl-cast.cc`
- `crawl-ref/source/spl-util.cc`
- `crawl-ref/source/player-equip.cc`
- `crawl-ref/source/skills.cc`
- `crawl-ref/source/player-stats.cc`

Observed diff summary from `0.34.1` to trunk:

- `spl-cast.cc`: `11` insertions, `2` deletions
- `spl-util.cc`: `1` insertion, `1` deletion
- `player-equip.cc`: `20` insertions, `3` deletions
- `skills.cc`: `167` insertions, `9` deletions
- `player-stats.cc`: no diff in this range

What changed in those files:

- `spl-cast.cc` now extends `DUR_STAMPEDE` when `MUT_EAST_WIND` is active, updates exposed-target hit logic, and changes Spike Launcher helper calls.
- `spl-util.cc` only changes the `can_cast_malign_gateway` call signature.
- `player-equip.cc` renames `MUT_ROLLPAGE` checks to `MUT_STAMPEDE` and adds `WPN_ATHAME` self-damage handling on equip.
- `skills.cc` adds Four Winds skill tracking and mutation updates for Gale Centaur progression.
- `player-stats.cc` did not change.

Result: nothing in this pass required an immediate rewrite of the calculator's spell-failure, AC, EV, or SH formulas. Future version bumps should still re-check these files instead of assuming formula safety.
