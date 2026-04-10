# Morgue Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users paste a DCSS morgue into the app, overwrite every supported calculator field from the parsed data, confirm before switching versions, and show an `Applied` / `Skipped` import summary.

**Architecture:** Keep parser integration behind one dedicated `src/morgueImport/importMorgue.ts` boundary. That module should parse text with `dcss-morgue-parser`, normalize the raw morgue version into one supported app version, build a fresh calculator state from version defaults, overwrite supported fields, and emit a summary object the UI can render. The React side should stay thin: one small control component owns the paste modal, version-confirm modal, and summary panel, while `App.tsx` only passes the current version and applies the imported state.

**Tech Stack:** TypeScript, React 18, Vite, Jest with ts-jest, `dcss-morgue-parser`, `jest-environment-jsdom`

---

## File Map

### Create

- `src/morgueImport/importMorgue.ts`
- `src/morgueImport/__fixtures__/deepElfConjurer033.ts`
- `src/morgueImport/__tests__/importMorgue.test.ts`
- `src/components/MorgueImportControls.tsx`
- `src/components/__tests__/MorgueImportControls.test.tsx`

### Modify

- `package.json`
- `pnpm-lock.yaml`
- `src/App.tsx`

### Existing Tests To Keep Green

- `src/versioning/__tests__/defaultState.test.ts`
- `src/versioning/__tests__/versionRegistry.test.ts`
- `src/utils/__tests__/acCalculations.test.ts`
- `src/utils/__tests__/evCalculations.test.ts`
- `src/utils/__tests__/spellCalculations.test.ts`

## Task 1: Add The Parser-Backed Import Mapper

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/morgueImport/importMorgue.ts`
- Create: `src/morgueImport/__fixtures__/deepElfConjurer033.ts`
- Create: `src/morgueImport/__tests__/importMorgue.test.ts`
- Test: `src/morgueImport/__tests__/importMorgue.test.ts`

- [ ] **Step 1: Write the fixture and the failing mapper tests**

```ts
// src/morgueImport/__fixtures__/deepElfConjurer033.ts
export const deepElfConjurer033Morgue = String.raw`Dungeon Crawl Stone Soup version 0.33-b1 (webtiles) character file.

699 caiman the Thaumaturge (level 7, -6/38 HPs)
             Began as a Deep Elf Conjurer on Apr 29, 2025.
             Shot with an arrow by a centaur (12 damage)
             ... on level 8 of the Dungeon.
             The game lasted 00:15:18 (1088 turns).

caiman the Thaumaturge (Deep Elf Conjurer)          Turns: 1088, Time: 00:15:18

Health: -6/38      AC:  3    Str:  4    XL:     7   Next: 38%
Magic:  8/20       EV: 11    Int: 25    God:
Gold:   96         SH:  0    Dex: 13    Spells: 10/22 levels left

rFire   . . .        b - +2 trident (heavy)
rCold   . . .        (no offhand)
rNeg    . . .        j - +0 robe
rPois   .            l - +0 helmet
rElec   .            (no cloak)
rCorr   .            (no gloves)
SInv    +            (no boots)
Will    .....        (no amulet)
Stlth   ++           i - ring of see invisible
HPRegen 0.26/turn    (no ring)
MPRegen 0.34/turn

%: no passive effects
@: no status effects
A: magic regeneration
a: no special abilities

Inventory:

Hand Weapons
 a - the +7 Throatcutter {drain, coup de grace}
 b - a +2 heavy trident (weapon)
Armour
 j - a +0 robe (worn)
 l - a +0 helmet (worn)
 n - a +0 kite shield
Jewellery
 i - a ring of see invisible (worn)
Wands
 k - a wand of flame (22)

   Skills:
 - Level 1.0 Fighting
 - Level 2.4 Dodging
 - Level 2.4 Stealth
 + Level 8.1 Spellcasting
 + Level 6.1 Conjurations
 + Level 2.3 Translocations
 - Level 3.0 Alchemy

You had 10 spell levels left.
You knew the following spells:

 Your Spells              Type           Power      Damage    Failure   Level
a - Magic Dart            Conj           100%       1d8       1%          1
b - Searing Ray           Conj           80%        2d7       1%          2
c - Iskenderun's Mystic   Conj/Tloc      31%        2d8 (+2d4 11%         4
d - Fulminant Prism       Conj/Alch      16%        3d10      9%          4
e - Apportation           Tloc           44%        N/A       2%          1

Your spell library contained the following spells:

 Spells                   Type           Power      Damage    Failure   Level
 Poisonous Vapours        Alch/Air       68%        1d3       3%          1
`;
```

```ts
// src/morgueImport/__tests__/importMorgue.test.ts
import { describe, expect, test } from "@jest/globals";
import type { EquipmentItemSnapshot, ParsedMorgueTextRecord } from "dcss-morgue-parser";
import { parseMorgueText } from "dcss-morgue-parser";
import { deepElfConjurer033Morgue } from "../__fixtures__/deepElfConjurer033";
import {
  buildImportedCalculatorState,
  parseImportedMorgue,
  normalizeMorgueVersion,
} from "../importMorgue";

const makeItem = (
  displayName: string,
  baseType: string | null,
  booleanProps: Record<string, true> = {}
): EquipmentItemSnapshot =>
  ({
    rawName: displayName,
    displayName,
    objectClass: "jewellery",
    equipState: "worn",
    isCursed: false,
    baseType,
    enchant: null,
    artifactKind: "normal",
    ego: null,
    subtypeEffect: null,
    propertiesText: null,
    properties: {
      numeric: {},
      booleanProps,
      opaqueTokens: [],
    },
    intrinsicProperties: {
      numeric: {},
      booleanProps: {},
      opaqueTokens: [],
    },
    egoProperties: {
      numeric: {},
      booleanProps: {},
      opaqueTokens: [],
    },
    artifactProperties: {
      numeric: {},
      booleanProps: {},
      opaqueTokens: [],
    },
  }) as EquipmentItemSnapshot;

describe("morgue import mapper", () => {
  test("normalizes raw morgue versions into supported app versions", () => {
    expect(normalizeMorgueVersion("0.32.1-5-gba85492")).toBe("0.32");
    expect(normalizeMorgueVersion("0.33-b1")).toBe("0.33");
    expect(normalizeMorgueVersion("0.34.1")).toBe("0.34");
    expect(normalizeMorgueVersion("0.35-a0-181-g84ebf06")).toBe("trunk");
  });

  test("maps a parsed 0.33 morgue into overwriteable calculator state and summary", () => {
    const parsed = parseMorgueText(deepElfConjurer033Morgue);
    if (!parsed.ok) {
      throw new Error(`fixture should parse: ${parsed.failure.reason}`);
    }

    const result = buildImportedCalculatorState(parsed.record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.detectedVersion).toBe("0.33");
    expect(result.importedState).toMatchObject({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      dexterity: 13,
      intelligence: 25,
      armour: "robe",
      shield: "none",
      orb: "none",
      helmet: true,
      gloves: false,
      boots: false,
      cloak: false,
      barding: false,
      armourSkill: 0,
      shieldSkill: 0,
      dodgingSkill: 2.4,
      spellcasting: 8.1,
      wizardry: 0,
      wildMagic: 0,
      targetSpell: "Magic Dart",
    });
    expect(result.importedState.schoolSkills).toMatchObject({
      conjuration: 6.1,
      translocation: 2.3,
      alchemy: 3,
    });
    expect(result.summary.applied).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Version" }),
        expect.objectContaining({ label: "Species" }),
        expect.objectContaining({ label: "Stats" }),
        expect.objectContaining({ label: "Skills" }),
        expect.objectContaining({ label: "Target spell" }),
      ])
    );
    expect(result.summary.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Rings" }),
        expect.objectContaining({ label: "Mutations" }),
      ])
    );
  });

  test("derives wizardry, wild magic, and body-armour ego when the parser semantics are explicit", () => {
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Revenant",
      speciesVariant: null,
      background: "Fighter",
      god: null,
      xl: 10,
      ac: 20,
      ev: 11,
      sh: 0,
      strength: 19,
      intelligence: 14,
      dexterity: 9,
      bodyArmour: "plate armour",
      shield: "none",
      helmets: [],
      gloves: [],
      footwear: [],
      cloaks: [],
      orb: "none",
      amulets: ["amulet of wizardry"],
      rings: [],
      talisman: "none",
      form: null,
      bodyArmourDetails: makeItem("plate armour of resonance", "plate armour", {
        Resonance: true,
      }),
      amuletDetails: [makeItem("amulet of wizardry", "amulet", { Wiz: true })],
      skills: {
        fighting: 0,
        macesFlails: 0,
        axes: 0,
        polearms: 0,
        staves: 0,
        unarmedCombat: 0,
        throwing: 0,
        shortBlades: 0,
        longBlades: 0,
        rangedWeapons: 0,
        armour: 20,
        dodging: 3,
        shields: 0,
        stealth: 0,
        spellcasting: 8,
        conjurations: 0,
        hexes: 0,
        summonings: 0,
        necromancy: 0,
        forgecraft: 9,
        translocations: 0,
        transmutations: 0,
        alchemy: 0,
        fireMagic: 7,
        iceMagic: 0,
        airMagic: 0,
        earthMagic: 8,
        poisonMagic: 0,
        invocations: 0,
        evocations: 0,
        shapeshifting: 0,
      },
      effectiveSkills: {
        fighting: 0,
        macesFlails: 0,
        axes: 0,
        polearms: 0,
        staves: 0,
        unarmedCombat: 0,
        throwing: 0,
        shortBlades: 0,
        longBlades: 0,
        rangedWeapons: 0,
        armour: 20,
        dodging: 3,
        shields: 0,
        stealth: 0,
        spellcasting: 8,
        conjurations: 0,
        hexes: 0,
        summonings: 0,
        necromancy: 0,
        forgecraft: 9,
        translocations: 0,
        transmutations: 0,
        alchemy: 0,
        fireMagic: 7,
        iceMagic: 0,
        airMagic: 0,
        earthMagic: 8,
        poisonMagic: 0,
        invocations: 0,
        evocations: 0,
        shapeshifting: 0,
      },
      spells: [
        {
          name: "Hellfire Mortar",
          failurePercent: 73,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [{ name: "wild magic", level: 2 }],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.detectedVersion).toBe("trunk");
    expect(result.importedState.bodyArmourEgo).toBe("resonance");
    expect(result.importedState.wizardry).toBe(1);
    expect(result.importedState.wildMagic).toBe(2);
  });

  test("returns a parser failure record for invalid text", () => {
    expect(parseImportedMorgue("not a morgue")).toMatchObject({
      ok: false,
      kind: "parse_failed",
    });
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail before the mapper exists**

Run:

```bash
pnpm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts
```

Expected:

```text
FAIL src/morgueImport/__tests__/importMorgue.test.ts
Cannot find module 'dcss-morgue-parser'
Cannot find module '../importMorgue'
```

- [ ] **Step 3: Add the parser dependency and implement the import boundary**

Run:

```bash
pnpm add dcss-morgue-parser
pnpm add -D jest-environment-jsdom
```

Then add the mapper:

```ts
// src/morgueImport/importMorgue.ts
import {
  parseMorgueText,
  type EquipmentItemSnapshot,
  type ParsedMorgueTextRecord,
} from "dcss-morgue-parser";
import type { CalculatorState } from "@/hooks/useCalculatorState";
import {
  armourOptions,
  orbOptions,
  shieldOptions,
  type ArmourKey,
  type BodyArmourEgoKey,
  type OrbKey,
  type ShieldKey,
} from "@/types/equipment";
import type { GameVersion } from "@/types/game";
import { speciesOptions } from "@/types/species";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { getBodyArmourEgoOptions } from "@/versioning/equipmentData";
import { getVersionConfig } from "@/versioning/versionRegistry";

export type MorgueImportSummaryEntry = {
  label: string;
  detail?: string;
};

export type MorgueImportSummary = {
  applied: MorgueImportSummaryEntry[];
  skipped: MorgueImportSummaryEntry[];
};

export type MorgueImportFailure = {
  ok: false;
  kind: "empty_input" | "parse_failed" | "unsupported_version" | "unsupported_species";
  message: string;
  detail?: string | null;
};

export type MorgueImportSuccess = {
  ok: true;
  sourceVersion: string;
  detectedVersion: GameVersion;
  importedState: CalculatorState<GameVersion>;
  summary: MorgueImportSummary;
};

export type MorgueImportResult = MorgueImportFailure | MorgueImportSuccess;

const schoolSkillKeyMap = {
  conjurations: "conjuration",
  hexes: "hexes",
  summonings: "summoning",
  necromancy: "necromancy",
  forgecraft: "forgecraft",
  translocations: "translocation",
  alchemy: "alchemy",
  fireMagic: "fire",
  iceMagic: "ice",
  airMagic: "air",
  earthMagic: "earth",
} as const;

const armourBaseTypeToKey = Object.fromEntries(
  Object.entries(armourOptions).map(([key, value]) => [value.name, key as ArmourKey])
) as Record<string, ArmourKey>;

const shieldBaseTypeToKey = Object.fromEntries(
  Object.entries(shieldOptions).map(([key, value]) => [value.name, key as ShieldKey])
) as Record<string, ShieldKey>;

const orbBaseTypeToKey = Object.fromEntries(
  Object.entries(orbOptions).map(([key, value]) => [value.name, key as OrbKey])
) as Record<string, OrbKey>;

const collectEquippedItems = (record: ParsedMorgueTextRecord): EquipmentItemSnapshot[] =>
  [
    record.bodyArmourDetails,
    record.shieldDetails,
    ...(record.helmetDetails ?? []),
    ...(record.glovesDetails ?? []),
    ...(record.footwearDetails ?? []),
    ...(record.cloakDetails ?? []),
    record.orbDetails,
    ...(record.amuletDetails ?? []),
    ...(record.ringDetails ?? []),
    record.gizmoDetails,
    record.talismanDetails,
  ].filter((item): item is EquipmentItemSnapshot => item !== undefined);

const hasBaseType = (
  items: EquipmentItemSnapshot[] | undefined,
  targetBaseType: string
) => (items ?? []).some((item) => item.baseType === targetBaseType);

const mapArmour = (baseType: string | null | undefined): ArmourKey | null => {
  if (!baseType || baseType === "none") {
    return "none";
  }

  return armourBaseTypeToKey[baseType] ?? null;
};

const mapShield = (baseType: string | null | undefined): ShieldKey | null => {
  if (!baseType || baseType === "none") {
    return "none";
  }

  return shieldBaseTypeToKey[baseType] ?? null;
};

const mapOrb = (baseType: string | null | undefined): OrbKey | null => {
  if (!baseType || baseType === "none") {
    return "none";
  }

  return orbBaseTypeToKey[baseType] ?? null;
};

const countBooleanProperty = (
  record: ParsedMorgueTextRecord,
  property: "Wiz"
) => {
  return collectEquippedItems(record).filter(
    (item) => item.properties.booleanProps[property] === true
  ).length;
};

const deriveBodyArmourEgo = (
  record: ParsedMorgueTextRecord,
  version: GameVersion
): BodyArmourEgoKey | null => {
  const detail = record.bodyArmourDetails;
  if (!detail) {
    return null;
  }

  const supported = new Set(Object.keys(getBodyArmourEgoOptions(version)));
  if (detail.properties.booleanProps.Command && supported.has("command")) {
    return "command";
  }
  if (detail.properties.booleanProps.Death && supported.has("death")) {
    return "death";
  }
  if (detail.properties.booleanProps.Resonance && supported.has("resonance")) {
    return "resonance";
  }

  return null;
};

const deriveWildMagic = (record: ParsedMorgueTextRecord) => {
  const activeWildMagic = record.mutations.find(
    (mutation) =>
      mutation.name === "wild magic" &&
      mutation.suppressed !== true &&
      mutation.transient !== true &&
      typeof mutation.level === "number"
  );

  return activeWildMagic?.level ?? null;
};

const chooseTargetSpell = (
  version: GameVersion,
  record: ParsedMorgueTextRecord
) => {
  const supportedNames = new Set(
    getVersionConfig(version).spells.map((spell) => spell.name)
  );

  const preferred =
    record.spells.find(
      (spell) => spell.memorized && spell.castable && supportedNames.has(spell.name)
    ) ??
    record.spells.find(
      (spell) => spell.castable && supportedNames.has(spell.name)
    );

  return preferred?.name ?? null;
};

export const normalizeMorgueVersion = (rawVersion: string): GameVersion | null => {
  if (rawVersion.startsWith("0.32")) return "0.32";
  if (rawVersion.startsWith("0.33")) return "0.33";
  if (rawVersion.startsWith("0.34")) return "0.34";
  if (/^0\.(35|36|37)/.test(rawVersion)) return "trunk";
  return null;
};

export const buildImportedCalculatorState = (
  record: ParsedMorgueTextRecord
): MorgueImportResult => {
  const detectedVersion = normalizeMorgueVersion(record.version);
  if (!detectedVersion) {
    return {
      ok: false,
      kind: "unsupported_version",
      message: "This morgue version is not supported by the calculator.",
      detail: record.version,
    };
  }

  const speciesNameToKey = Object.fromEntries(
    Object.entries(speciesOptions(detectedVersion)).map(([key, value]) => [value.name, key])
  );
  const speciesKey = speciesNameToKey[record.species];
  if (!speciesKey) {
    return {
      ok: false,
      kind: "unsupported_species",
      message: "This morgue species is not available in the selected calculator version.",
      detail: record.species,
    };
  }

  const importedState = buildDefaultCalculatorState(detectedVersion) as CalculatorState<GameVersion>;
  const summary: MorgueImportSummary = {
    applied: [],
    skipped: [],
  };

  importedState.version = detectedVersion;
  importedState.species = speciesKey as CalculatorState<GameVersion>["species"];
  importedState.strength = record.strength;
  importedState.dexterity = record.dexterity;
  importedState.intelligence = record.intelligence;
  importedState.armourSkill = record.effectiveSkills.armour;
  importedState.shieldSkill = record.effectiveSkills.shields;
  importedState.dodgingSkill = record.effectiveSkills.dodging;
  importedState.spellcasting = record.effectiveSkills.spellcasting;
  summary.applied.push(
    { label: "Version", detail: `${record.version} -> ${detectedVersion}` },
    { label: "Species", detail: record.species },
    {
      label: "Stats",
      detail: `Str ${record.strength}, Dex ${record.dexterity}, Int ${record.intelligence}`,
    },
    {
      label: "Skills",
      detail: `Armour ${record.effectiveSkills.armour}, Shields ${record.effectiveSkills.shields}, Dodging ${record.effectiveSkills.dodging}, Spellcasting ${record.effectiveSkills.spellcasting}`,
    }
  );

  const armour = mapArmour(record.bodyArmourDetails?.baseType ?? record.bodyArmour);
  if (armour) {
    importedState.armour = armour;
    summary.applied.push({ label: "Body armour", detail: record.bodyArmour });
  }

  const shield = mapShield(record.shieldDetails?.baseType ?? record.shield);
  const orb = mapOrb(record.orbDetails?.baseType ?? record.orb);
  if (shield) {
    importedState.shield = shield;
  }
  if (orb) {
    importedState.orb = orb;
  }
  if (importedState.shield !== "none") {
    importedState.orb = "none";
  }
  if (importedState.orb !== "none") {
    importedState.shield = "none";
  }
  summary.applied.push({
    label: "Shield / orb",
    detail: importedState.shield !== "none" ? record.shield : record.orb,
  });

  importedState.helmet = hasBaseType(record.helmetDetails, "helmet");
  importedState.gloves = record.gloves.length > 0;
  importedState.secondGloves =
    getVersionConfig(detectedVersion).features.secondGloves && record.gloves.length > 1;
  importedState.boots = hasBaseType(record.footwearDetails, "boots");
  importedState.barding = hasBaseType(record.footwearDetails, "barding");
  importedState.cloak = hasBaseType(record.cloakDetails, "cloak");
  summary.applied.push({ label: "Auxiliary armour" });

  if (record.helmets.some((name) => name.includes("hat"))) {
    summary.skipped.push({
      label: "Headgear",
      detail: "Hat is not modeled separately from helmet.",
    });
  }
  if (record.cloaks.some((name) => name.includes("scarf"))) {
    summary.skipped.push({
      label: "Cloaks",
      detail: "Scarf is not modeled separately from cloak.",
    });
  }

  for (const [parserKey, stateKey] of Object.entries(schoolSkillKeyMap)) {
    if (importedState.schoolSkills && stateKey in importedState.schoolSkills) {
      importedState.schoolSkills[stateKey as keyof typeof importedState.schoolSkills] =
        record.effectiveSkills[parserKey as keyof typeof record.effectiveSkills];
    }
  }

  const targetSpell = chooseTargetSpell(detectedVersion, record);
  if (targetSpell) {
    importedState.targetSpell = targetSpell as CalculatorState<GameVersion>["targetSpell"];
    summary.applied.push({ label: "Target spell", detail: targetSpell });
  }

  const wizardry = countBooleanProperty(record, "Wiz");
  importedState.wizardry = wizardry;
  if (wizardry > 0) {
    summary.applied.push({ label: "Wizardry", detail: `${wizardry}` });
  }

  const wildMagic = deriveWildMagic(record);
  if (wildMagic !== null) {
    importedState.wildMagic = wildMagic;
    summary.applied.push({ label: "Wild magic", detail: `${wildMagic}` });
  } else if (record.mutations.some((mutation) => mutation.name === "wild magic")) {
    summary.skipped.push({
      label: "Wild magic",
      detail: "Wild magic was present but could not be read as an active numeric level.",
    });
  }

  const bodyArmourEgo = deriveBodyArmourEgo(record, detectedVersion);
  if (bodyArmourEgo) {
    importedState.bodyArmourEgo = bodyArmourEgo;
    summary.applied.push({ label: "Body armour ego", detail: bodyArmourEgo });
  }

  if (record.rings.length > 0) {
    summary.skipped.push({
      label: "Rings",
      detail: "Jewellery is not modeled directly by this calculator.",
    });
  }
  if (record.amulets.length > 0) {
    summary.skipped.push({
      label: "Amulets",
      detail: "Amulets are not modeled directly by this calculator.",
    });
  }
  if (record.gizmo) {
    summary.skipped.push({
      label: "Gizmo",
      detail: "Gizmos are not modeled by this calculator.",
    });
  }
  if (record.talisman !== "none") {
    summary.skipped.push({
      label: "Talisman",
      detail: "Talismans are not modeled by this calculator.",
    });
  }
  if (record.form) {
    summary.skipped.push({
      label: "Form",
      detail: "Form state is not modeled by this calculator.",
    });
  }

  const leftoverMutations = record.mutations.filter(
    (mutation) => mutation.name !== "wild magic"
  );
  if (leftoverMutations.length > 0) {
    summary.skipped.push({
      label: "Mutations",
      detail: "Only wild magic is mapped into calculator state today.",
    });
  }

  return {
    ok: true,
    sourceVersion: record.version,
    detectedVersion,
    importedState,
    summary,
  };
};

export const parseImportedMorgue = (text: string): MorgueImportResult => {
  if (text.trim() === "") {
    return {
      ok: false,
      kind: "empty_input",
      message: "Paste a morgue dump before applying the import.",
    };
  }

  const parsed = parseMorgueText(text);
  if (!parsed.ok) {
    return {
      ok: false,
      kind: "parse_failed",
      message: "This morgue could not be parsed. It may use an unsupported layout.",
      detail: `${parsed.failure.reason}${parsed.failure.detail ? `: ${parsed.failure.detail}` : ""}`,
    };
  }

  return buildImportedCalculatorState(parsed.record);
};
```

- [ ] **Step 4: Run the mapper test again and make sure it passes**

Run:

```bash
pnpm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts
```

Expected:

```text
PASS src/morgueImport/__tests__/importMorgue.test.ts
```

- [ ] **Step 5: Commit the mapper foundation**

```bash
git add package.json pnpm-lock.yaml src/morgueImport
git commit -m "feat: add morgue import mapper"
```

## Task 2: Add The Import Controls And Wire Them Into App

**Files:**
- Create: `src/components/MorgueImportControls.tsx`
- Create: `src/components/__tests__/MorgueImportControls.test.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/__tests__/MorgueImportControls.test.tsx`
- Test: `src/morgueImport/__tests__/importMorgue.test.ts`

- [ ] **Step 1: Add the failing UI tests for the paste modal, version confirmation, and summary rendering**

```tsx
/** @jest-environment jsdom */

// src/components/__tests__/MorgueImportControls.test.tsx
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import type { CalculatorState } from "@/hooks/useCalculatorState";
import type { GameVersion } from "@/types/game";
import MorgueImportControls from "../MorgueImportControls";
import { deepElfConjurer033Morgue } from "@/morgueImport/__fixtures__/deepElfConjurer033";

describe("MorgueImportControls", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  test("asks for confirmation when the morgue targets a different version, then applies and shows the summary", async () => {
    const onApplyImport = jest.fn<(state: CalculatorState<GameVersion>) => void>();

    await act(async () => {
      root.render(
        <MorgueImportControls
          currentVersion="trunk"
          onApplyImport={onApplyImport}
        />
      );
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="open-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    const textarea = container.querySelector(
      '[data-testid="morgue-import-textarea"]'
    ) as HTMLTextAreaElement;

    await act(async () => {
      textarea.value = deepElfConjurer033Morgue;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="apply-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    expect(container.textContent).toContain("0.33");
    expect(onApplyImport).not.toHaveBeenCalled();

    await act(async () => {
      (
        container.querySelector('[data-testid="confirm-version-import"]') as HTMLButtonElement
      ).click();
    });

    expect(onApplyImport).toHaveBeenCalledTimes(1);
    expect(onApplyImport.mock.calls[0][0]).toMatchObject({
      version: "0.33",
      species: "deepElf",
      targetSpell: "Magic Dart",
    });
    expect(container.textContent).toContain("Applied");
    expect(container.textContent).toContain("Skipped");
    expect(container.textContent).toContain("Rings");
  });

  test("shows an inline parser failure without calling onApplyImport", async () => {
    const onApplyImport = jest.fn<(state: CalculatorState<GameVersion>) => void>();

    await act(async () => {
      root.render(
        <MorgueImportControls
          currentVersion="0.34"
          onApplyImport={onApplyImport}
        />
      );
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="open-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    const textarea = container.querySelector(
      '[data-testid="morgue-import-textarea"]'
    ) as HTMLTextAreaElement;

    await act(async () => {
      textarea.value = "not a morgue";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="apply-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    expect(onApplyImport).not.toHaveBeenCalled();
    expect(container.textContent).toContain("could not be parsed");
  });
});
```

- [ ] **Step 2: Run the UI test to prove it fails before the control component exists**

Run:

```bash
pnpm test -- --runInBand src/components/__tests__/MorgueImportControls.test.tsx
```

Expected:

```text
FAIL src/components/__tests__/MorgueImportControls.test.tsx
Cannot find module '../MorgueImportControls'
```

- [ ] **Step 3: Implement the import control component and wire it into `App.tsx`**

```tsx
// src/components/MorgueImportControls.tsx
import { useState } from "react";
import type { CalculatorState } from "@/hooks/useCalculatorState";
import { Button } from "@/components/ui/button";
import type { GameVersion } from "@/types/game";
import {
  parseImportedMorgue,
  type MorgueImportFailure,
  type MorgueImportSuccess,
} from "@/morgueImport/importMorgue";

type MorgueImportControlsProps = {
  currentVersion: GameVersion;
  onApplyImport: (nextState: CalculatorState<GameVersion>) => void;
};

const overlayClassName =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4";
const panelClassName =
  "w-full max-w-2xl rounded-lg border border-gray-700 bg-[#10131a] p-4 shadow-xl";

export default function MorgueImportControls({
  currentVersion,
  onApplyImport,
}: MorgueImportControlsProps) {
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [failure, setFailure] = useState<MorgueImportFailure | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState<MorgueImportSuccess | null>(null);
  const [lastSuccess, setLastSuccess] = useState<MorgueImportSuccess | null>(null);

  const closePasteModal = () => {
    setIsPasteOpen(false);
    setDraftText("");
    setFailure(null);
  };

  const applySuccess = (result: MorgueImportSuccess) => {
    onApplyImport(result.importedState);
    setLastSuccess(result);
    setPendingSuccess(null);
    closePasteModal();
  };

  const handleApply = () => {
    const result = parseImportedMorgue(draftText);
    if (!result.ok) {
      setFailure(result);
      return;
    }

    if (result.detectedVersion !== currentVersion) {
      setPendingSuccess(result);
      setIsPasteOpen(false);
      setFailure(null);
      return;
    }

    applySuccess(result);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        data-testid="open-morgue-import"
        onClick={() => setIsPasteOpen(true)}
      >
        Import Morgue
      </Button>

      {lastSuccess && (
        <section
          data-testid="morgue-import-summary"
          className="mt-3 rounded-md border border-gray-700 bg-[#0d1016] p-3 text-sm"
        >
          <div className="font-semibold">
            Last import: {lastSuccess.sourceVersion} -> {lastSuccess.detectedVersion}
          </div>
          <div className="mt-2">
            <div className="font-medium">Applied</div>
            <ul className="list-disc pl-5">
              {lastSuccess.summary.applied.map((entry) => (
                <li key={`applied-${entry.label}`}>
                  {entry.label}
                  {entry.detail ? `: ${entry.detail}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <div className="font-medium">Skipped</div>
            <ul className="list-disc pl-5">
              {lastSuccess.summary.skipped.length === 0 ? (
                <li>None</li>
              ) : (
                lastSuccess.summary.skipped.map((entry) => (
                  <li key={`skipped-${entry.label}`}>
                    {entry.label}
                    {entry.detail ? `: ${entry.detail}` : ""}
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      )}

      {isPasteOpen && (
        <div className={overlayClassName} role="dialog" aria-modal="true">
          <div className={panelClassName}>
            <h2 className="text-lg font-semibold">Import Morgue</h2>
            <p className="mt-1 text-sm text-gray-300">
              Paste a morgue dump. Supported fields will overwrite the current calculator state.
            </p>
            <textarea
              data-testid="morgue-import-textarea"
              className="mt-3 min-h-72 w-full rounded-md border border-gray-700 bg-[#0b0d12] p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
            {failure && (
              <div className="mt-3 rounded-md border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">
                <div className="font-medium">{failure.message}</div>
                {failure.detail ? <div className="mt-1">{failure.detail}</div> : null}
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={closePasteModal}>
                Cancel
              </Button>
              <Button data-testid="apply-morgue-import" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingSuccess && (
        <div className={overlayClassName} role="dialog" aria-modal="true">
          <div className={panelClassName}>
            <h2 className="text-lg font-semibold">Switch Version Before Import?</h2>
            <p className="mt-2 text-sm text-gray-300">
              This morgue was parsed as {pendingSuccess.sourceVersion}, which maps to
              calculator version {pendingSuccess.detectedVersion}. The current calculator
              is set to {currentVersion}. Switch versions and apply the import?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setPendingSuccess(null)}>
                Cancel
              </Button>
              <Button
                data-testid="confirm-version-import"
                onClick={() => applySuccess(pendingSuccess)}
              >
                Switch And Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

```tsx
// src/App.tsx
import MorgueImportControls from "@/components/MorgueImportControls";

function App() {
  const { state, setState, resetState, changeVersion, flash } =
    useCalculatorState();

  return (
    <div className="p-1 md:p-4 flex items-center justify-center w-screen">
      <Tabs defaultValue="ev" className="w-full max-w-2xl">
        <div className={cn("relative overflow-hidden transition-all duration-150", isFlashing && "bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)] after:absolute after:inset-0 after:bg-white/20 after:pointer-events-none after:z-10")}>
          <TabsList
            className="w-full gap-x-2 relative"
            style={{ outline: "1px solid white", outlineOffset: "-4px" }}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-x-2">
              <Select
                value={state.version}
                onValueChange={(value) => changeVersion(value as GameVersion)}
              >
                <SelectTrigger className="h-5 sm:w-[120px] w-[90px] border-[#999] text-white">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  {gameVersions.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <MorgueImportControls
                currentVersion={state.version}
                onApplyImport={(importedState) => setState(importedState)}
              />
            </div>
            <TabsTrigger value="ev">DCSS Calculator</TabsTrigger>
            <button
              onClick={resetState}
              className="text-sm text-muted-foreground hover:text-foreground absolute right-8"
            >
              <span className="hidden md:block">Reset to Default</span>
              <span className="block md:hidden">Reset</span>
            </button>
          </TabsList>
          <TabsContent value="ev">
            <Calculator state={state} setState={setState} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Run the focused tests, then the full verification suite**

Run:

```bash
pnpm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts src/components/__tests__/MorgueImportControls.test.tsx
pnpm lint
pnpm build
pnpm test -- --runInBand
```

Expected:

```text
PASS src/morgueImport/__tests__/importMorgue.test.ts
PASS src/components/__tests__/MorgueImportControls.test.tsx
Done in lint
vite build completed successfully
All Jest suites passed
```

- [ ] **Step 5: Commit the UI flow after the verification commands are green**

```bash
git add src/components/MorgueImportControls.tsx src/components/__tests__/MorgueImportControls.test.tsx src/App.tsx
git commit -m "feat: add morgue import controls"
```
