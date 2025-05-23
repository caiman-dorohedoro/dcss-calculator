import * as fs from "fs";

// 0.32
const SPELL_DATA_FILE_NAME = `spl-data.0.32.h`;
const SPELL_DATA_PATH = `src/data/${SPELL_DATA_FILE_NAME}`;
const EXTRACTED_SPELL_DATA_FILE_NAME = "generated-spells.0.32.json";
const EXTRACTED_SPELL_TYPES_FILE_NAME = "generated-spells.0.32.d.ts";
const EXTRACTED_SPELL_DATA_PATH = `src/data/${EXTRACTED_SPELL_DATA_FILE_NAME}`;
const EXTRACTED_SPELL_TYPES_PATH = `src/types/${EXTRACTED_SPELL_TYPES_FILE_NAME}`;

// 0.33
const SPELL_DATA_FILE_NAME_0_33 = `spl-data.0.33.h`;
const SPELL_DATA_PATH_0_33 = `src/data/${SPELL_DATA_FILE_NAME_0_33}`;
const EXTRACTED_SPELL_DATA_FILE_NAME_0_33 = "generated-spells.0.33.json";
const EXTRACTED_SPELL_TYPES_FILE_NAME_0_33 = "generated-spells.0.33.d.ts";
const EXTRACTED_SPELL_DATA_PATH_0_33 = `src/data/${EXTRACTED_SPELL_DATA_FILE_NAME_0_33}`;
const EXTRACTED_SPELL_TYPES_PATH_0_33 = `src/types/${EXTRACTED_SPELL_TYPES_FILE_NAME_0_33}`;

// trunk
const TRUNK_SPELL_DATA_FILE_NAME = 'spl-data.trunk.20240428.h';
const TRUNK_SPELL_DATA_PATH = `src/data/${TRUNK_SPELL_DATA_FILE_NAME}`;
const TRUNK_EXTRACTED_SPELL_DATA_FILE_NAME = "generated-spells.trunk.json";
const TRUNK_EXTRACTED_SPELL_TYPES_FILE_NAME = "generated-spells.trunk.d.ts";
const TRUNK_EXTRACTED_SPELL_DATA_PATH = `src/data/${TRUNK_EXTRACTED_SPELL_DATA_FILE_NAME}`;
const TRUNK_EXTRACTED_SPELL_TYPES_PATH = `src/types/${TRUNK_EXTRACTED_SPELL_TYPES_FILE_NAME}`;

type SpellData_PROTO = {
  id: string;
  name: string;
  schools: string[];
  flags: string[];
  level: number;
  power: number;
  range: {
    min: number;
    max: number;
  };
  noise: number;
  tile: string;
};

const wandSpells = {
  WAND_FLAME: "SPELL_THROW_FLAME",
  WAND_PARALYSIS: "SPELL_PARALYSE",
  WAND_DIGGING: "SPELL_DIG",
  WAND_ICEBLAST: "SPELL_ICEBLAST",
  WAND_POLYMORPH: "SPELL_POLYMORPH",
  WAND_CHARMING: "SPELL_CHARMING",
  WAND_ACID: "SPELL_CORROSIVE_BOLT",
  WAND_LIGHT: "SPELL_BOLT_OF_LIGHT",
  WAND_QUICKSILVER: "SPELL_QUICKSILVER_BOLT",
  WAND_MINDBURST: "SPELL_MINDBURST",
  WAND_ROOTS: "SPELL_FASTROOT",
  WAND_WARPING: "SPELL_WARP_SPACE",
};

const playerNonbookSpells = [
  "SPELL_THUNDERBOLT",
  "SPELL_PHANTOM_MIRROR",
  "SPELL_TREMORSTONE",
  "SPELL_GRAVITAS",
  "SPELL_SONIC_WAVE",
  "SPELL_SMITING",
  "SPELL_UNLEASH_DESTRUCTION",
  "SPELL_HURL_TORCHLIGHT",
  "SPELL_HURL_DAMNATION",
  "SPELL_NOXIOUS_BREATH",
  "SPELL_COMBUSTION_BREATH",
  "SPELL_GLACIAL_BREATH",
  "SPELL_NULLIFYING_BREATH",
  "SPELL_STEAM_BREATH",
  "SPELL_CAUSTIC_BREATH",
  "SPELL_GALVANIC_BREATH",
  "SPELL_MUD_BREATH",
  "SPELL_RUST_BREATH",
  "SPELL_GOLDEN_BREATH",
];

const parseSpellDataHeader = (fileContent: string) => {
  try {
    // search for the start part more flexibly
    const startMarker = "spelldata[] =";
    const endMarker = "#if TAG_MAJOR_VERSION == 34";

    const dataStart = fileContent.indexOf(startMarker);
    const dataEnd = fileContent.indexOf(endMarker);

    if (dataStart === -1) {
      throw new Error(
        `Spell data section not found. File content starts with: ${fileContent.substring(
          0,
          100
        )}`
      );
    }

    // extract the entire array content through brace matching
    let braceCount = 0;
    const startIndex = fileContent.indexOf("{", dataStart);
    let currentIndex = startIndex;

    do {
      if (fileContent[currentIndex] === "{") {
        braceCount++;
      } else if (fileContent[currentIndex] === "}") {
        braceCount--;
      }
      currentIndex++;
    } while (
      braceCount > 0 &&
      currentIndex < (dataEnd === -1 ? fileContent.length : dataEnd)
    );

    // extract the entire spell data section
    const spellDataSection = fileContent.substring(startIndex, currentIndex);

    return spellDataSection;
  } catch (error) {
    console.error("Error extracting spell data:", error);
    throw error; // throw the error again so the caller can handle it
  }
};

export const parseSpellBlock = (
  spellBlock: string
): SpellData_PROTO | undefined => {
  if (spellBlock.includes("AXED_SPELL")) {
    return; // skip this iteration
  }

  try {
    // remove braces and whitespace at the beginning and end
    const cleanBlock = spellBlock.replace(/^{\s*|\s*}$/g, "");
    // split each line into an array
    const lines = cleanBlock
      .split("\n")
      .map((line) => line.split("//")[0].trim()) // remove comments
      .join("")
      .split(",")
      .map((line) => line.trim())
      .filter((line) => line !== ""); // remove empty strings

    if (lines.length < 9) return; // skip invalid data

    const spell = {
      id: lines[0].trim(),
      name: extractSpellName(lines[1]),
      schools: parseSchools(lines[2]),
      flags: parseFlags(lines[3]),
      level: parseInt(lines[4]) || 0,
      power: parseInt(lines[5]) || 0,
      range: {
        min: parseInt(lines[6]) || -1,
        max: parseInt(lines[7]) || -1,
      },
      noise: parseInt(lines[8]) || 0,
      tile: lines[9] ? lines[9].trim() : "",
    };

    return spell;
  } catch (error) {
    console.error("Error parsing spell block:", spellBlock, error);
  }
};

const parseSpellData = (spellDataSection: string) => {
  const spells: [] = [];
  // regex to match each spell block
  const spellRegex = /{\s*SPELL_[^}]+}/g;

  const matches = spellDataSection.match(spellRegex);
  if (!matches) return spells;

  const result = matches.map(parseSpellBlock).filter((p) => p !== undefined);

  return result;
};

const extractSpellName = (nameStr: string) => {
  const matches = nameStr.match(/"([^"]+)"/);
  return matches ? matches[1] : nameStr.trim();
};

const parseSchools = (schoolsStr: string) => {
  if (!schoolsStr) return [];
  return schoolsStr
    .split("|")
    .map((s) => s.trim().replace("spschool::", ""))
    .filter((s) => s !== "none");
};

const parseFlags = (flagsStr: string) => {
  if (!flagsStr) return [];
  return flagsStr
    .split("|")
    .map((f) => f.trim().replace("spflag::", ""))
    .filter((f) => f !== "none");
};

const extractSets = (filePath: string) => {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const spells = JSON.parse(fileContent);
  const uniqueNames = new Set<string>();
  const uniqueSchools = new Set<string>();
  const uniqueFlags = new Set<string>();

  spells.forEach((spell: SpellData_PROTO) => {
    uniqueNames.add(spell.name);
    spell.schools.forEach((school) => uniqueSchools.add(school));
    spell.flags.forEach((flag) => uniqueFlags.add(flag));
  });

  if (uniqueNames.size === 0) {
    throw new Error("No unique names found");
  }

  if (uniqueSchools.size === 0) {
    throw new Error("No unique schools found");
  }

  if (uniqueFlags.size === 0) {
    throw new Error("No unique flags found");
  }

  return {
    uniqueNames,
    uniqueSchools,
    uniqueFlags,
  };
};

const makeTypeDefinition = (sets: {
  uniqueNames: Set<string>;
  uniqueSchools: Set<string>;
  uniqueFlags: Set<string>;
}) => {
  const names = Array.from(sets.uniqueNames);
  const schools = Array.from(sets.uniqueSchools).map((school) =>
    school.replace(/(\r\n|\n|\r)/gm, "").trim()
  );
  const flags = Array.from(sets.uniqueFlags).map((flag) =>
    flag.replace(/(\r\n|\n|\r)/gm, "").trim()
  );

  return `export type SpellName = ${names
    .map((name) => `"${name}"`)
    .join(" | ")};
export type SpellSchool = ${schools.map((school) => `"${school}"`).join(" | ")};
export type SpellFlag = ${flags.map((flag) => `"${flag}"`).join(" | ")};
`;
};

const extractSpellData = (fileContent: string) => {
  const spellDataSection = parseSpellDataHeader(fileContent);
  if (!spellDataSection) {
    throw new Error("Failed to extract spell data section");
  }

  const parsedSpells = parseSpellData(spellDataSection);

  return parsedSpells;
};

const getOnlyPlayerSpells = (parsedSpells: SpellData_PROTO[]) => {
  const result = parsedSpells
    .filter(
      (spell) =>
        !spell.flags.includes("monster") && !spell.flags.includes(" monster")
    ) // Glaciate flag typo reflection
    .filter((spell) => !spell.flags.includes("testing"))
    .filter((spell) => !Object.values(wandSpells).includes(spell.id))
    .filter((spell) => !playerNonbookSpells.includes(spell.id));

  return result;
};

const writeOuputFiles = (
  spells: SpellData_PROTO[],
  extractedSpellDataPath: string
) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  fs.writeFileSync(extractedSpellDataPath, JSON.stringify(spells, null, 2));
};

const writeTypeDefinition = (
  typeDefinition: string,
  extractedSpellTypesPath: string
) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  fs.writeFileSync(extractedSpellTypesPath, typeDefinition);
};

const extract = (
  spellDataPath: string,
  extractedSpellDataPath: string,
  extractedSpellTypesPath: string
) => {
  try {
    const fileContent = fs.readFileSync(spellDataPath, "utf8");

    const parsedSpells = extractSpellData(fileContent);

    writeOuputFiles(getOnlyPlayerSpells(parsedSpells), extractedSpellDataPath);

    writeTypeDefinition(
      makeTypeDefinition(extractSets(extractedSpellDataPath)),
      extractedSpellTypesPath
    );
  } catch (error) {
    console.error("Failed to process spell data:", error);
    process.exit(1);
  }
};

// extract trunk
extract(
  TRUNK_SPELL_DATA_PATH,
  TRUNK_EXTRACTED_SPELL_DATA_PATH,
  TRUNK_EXTRACTED_SPELL_TYPES_PATH
);

// extract 0.32
extract(SPELL_DATA_PATH, EXTRACTED_SPELL_DATA_PATH, EXTRACTED_SPELL_TYPES_PATH);

// extract 0.33
extract(SPELL_DATA_PATH_0_33, EXTRACTED_SPELL_DATA_PATH_0_33, EXTRACTED_SPELL_TYPES_PATH_0_33);
