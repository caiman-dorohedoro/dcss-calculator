# Crawl 0.34.1 To Trunk Audit

## Baselines

- Audit date: `2026-04-05`
- Stable source: `crawl` tag `0.34.1` dereferenced to release commit `1eebc1a2892e1c89776a0d7a10691f8dac8d9796`
- Trunk source: local `crawl/` checkout, treating `crawl/master` as `origin/master`
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
- Species handling needs to stay version-aware:
  - `0.34.1` still ships `crawl-ref/source/dat/species/armataur.yaml`
  - trunk ships `crawl-ref/source/dat/species/gale-centaur.yaml`
  - trunk also keeps `crawl-ref/source/dat/species/deprecated-armataur.yaml` for compatibility
- The trunk species lineage and mutation naming moved from Armataur and `MUT_ROLLPAGE` toward Gale Centaur and `MUT_STAMPEDE`, so version-aware species traits remain the right boundary for calculator support instead of hardcoded string checks.
- The calculator follow-up now also reflects two mechanic fixes discovered during this audit:
  - trunk barding EV parity now includes Crawl's auxiliary-armour EV penalty
  - spell failure now models `death` body-armour ego for `Necromancy` spells
- A later pass on the same audit scope also confirmed two more spell-failure mechanics that matter for current app scope:
  - `fire dragon scales` changed encumbrance from `11` in `0.32` and `0.33` to `9` in `0.34` and trunk, so body-armour encumbrance must stay version-aware instead of assuming one shared table
  - spell failure can also be shifted by `command` body-armour ego for `Summoning`, `resonance` body-armour ego for `Forgecraft`, and `orb of energy`

## Previously Supported Repo Trunk Snapshot Drift

- The repo's previously committed trunk snapshot, before this 2026 refresh, still exposed older trunk-era app data:
  - `src/versioning/speciesData.ts` still modeled trunk as `armataur`
  - `src/types/generated-spells.trunk.d.ts` still modeled trunk with `Dazzling Flash` instead of `Gloom`
- The refreshed trunk snapshot now needs `galeCentaur` and `Gloom`.
- This matters operationally because a stable `0.34.1 -> trunk` diff does not reveal every repo-trunk drift:
  - `0.34` already includes `Gloom`, so the spell rename would not stand out from the stable baseline alone
  - the repo's older committed trunk support could therefore lag behind local Crawl even when the stable baseline looked close
- Future version refreshes should audit both:
  - stable release tag -> current local `crawl/master`
  - previously supported repo trunk snapshot -> current local `crawl/master`

## Audit Findings And Follow-Up Outcomes

### Barding EV Gap Confirmed And Fixed

- A `0.35-a0` Gale Centaur morgue validation initially showed the calculator matching the sampled spell-failure values, `AC 19`, and `SH 0`, but over-reporting EV as `18` instead of the morgue's `16`.
- The app already exposed a `barding` toggle in UI state and used it for AC, but EV originally ignored it because `calculateEV` only modeled body armour and shield penalties.
- Crawl trunk applies an additional auxiliary-armour EV penalty outside body armour and shield, and barding contributes a fixed `EV -2` in that path:
  - `crawl-ref/source/player.cc` `_player_aux_evasion_penalty`
  - `crawl-ref/source/item-prop.cc` `ARM_BARDING ... -60`
  - `crawl-ref/source/describe.cc` notes that barding affects evasion directly instead of using normal encumbrance behavior
- Crawl's spell-failure penalty still only uses body armour and shield, so this gap is specific to EV and should not be "fixed" by adding barding to spell-failure calculations.
- Follow-up result: the calculator now subtracts the equivalent barding auxiliary-armour EV penalty and the sampled Gale Centaur EV regressions match.

### Death-Ego Necromancy Gap Confirmed And Fixed

- A second `0.35-a0` Gale Centaur morgue validation initially showed a split result for spell failure:
  - non-Necromancy sample spells matched the calculator
  - several Necromancy-tagged sample spells from the spell library did not
- The sampled mismatches were:
  - `Kiss of Death` `9%` in the morgue vs `61%` in the calculator
  - `Soul Splinter` `9%` vs `61%`
  - `Grave Claw` `13%` vs `75%`
  - `Gloom` `24%` vs `93%`
  - `Vampiric Draining` `24%` vs `93%`
  - `Anguish` `54%` vs `100%`
  - `Animate Dead` `54%` vs `100%`
  - `Dispel Undead` `54%` vs `100%`
  - `Martyr's Knell` `54%` vs `100%`
  - `Curse of Agony` `85%` vs `100%`
- The dump character wore `+11 plate armour "Hukaluag" {Death, ...}` while in Death Form.
- Crawl trunk applies an additional spell-success reduction when the player is wearing `death ego` body armour and the spell has the `Necromancy` school:
  - `crawl-ref/source/spl-cast.cc` checks `SPARM_DEATH` and halves `fail_reduce` for Necromancy spells
- The sampled mismatches are all Necromancy spells or mixed-school spells that still include `Necromancy` in `crawl-ref/source/spl-data.h`.
- Death Form itself does not explain these mismatches:
  - `crawl-ref/source/dat/forms/death.yaml` grants resistances, undead holiness, and utility traits, but no spell-success or Necromancy-enhancer effect
  - `crawl-ref/source/transform.cc` only gives Death Form a `Will+` form bonus
- Follow-up result: the calculator now models `SPARM_DEATH` as a body-armour spell-success adjustment for `Necromancy` spells, and the sampled regressions match without changing the non-Necromancy parity cases.

### Spell Metadata Changes Observed

- Crawl trunk renamed two monster-only spell entries in `crawl-ref/source/spl-data.h`:
  - `SPELL_SUMMON_UFETUBUS` / `Summon Ufetubus` -> `SPELL_UFETUBI_SWARM` / `Ufetubi Swarm`
  - `SPELL_WALL_OF_BRAMBLES` / `Wall of Brambles` -> `SPELL_CAGE_OF_BRAMBLES` / `Cage of Brambles`
- `Cage of Brambles` also changed spell metadata, dropping `spschool::conjuration` and becoming `spschool::earth` only.
- These spell changes are relevant for Crawl auditing, but they are not reflected in the app's generated player-spell artifacts because `extractSpellDataHeader.ts` filters out monster-only spells.

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

Result: the initial version-data pass did not need a broad formula rewrite, but the audit did uncover two targeted calculator follow-ups that are now implemented: barding auxiliary-armour EV penalty and `death` ego Necromancy spell-success support. Future version bumps should still re-check these files instead of assuming formula safety.

## Deferred Follow-Up: Talismans And Forms

- Crawl currently applies direct spell-success adjustments for some forms:
  - `rime_yak` reduces `Ice` spell failure
  - `sphinx` reduces `Hexes` spell failure
  - `sun_scarab` reduces `Fire` spell failure
- These checks live in `crawl-ref/source/spl-cast.cc` and are separate from the body-armour and shield penalties.
- The calculator does not model form state or talisman state yet, and a correct implementation would need more than a single checkbox:
  - current form or talisman selection
  - how the form changes equipment availability or meld state
  - version-aware form metadata and school-specific spell-success bonuses
- Result: talisman and form spell-failure support should be tracked as a dedicated future batch instead of being mixed into this version-refresh patch.
