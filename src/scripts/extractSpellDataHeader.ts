import fs from "fs";

function extractSpellData(fileContent: string) {
  try {
    // 시작 부분을 찾을 때 더 유연하게 검색
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

    // 중괄호 매칭을 통해 전체 배열 내용을 추출
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

    // 전체 spell 데이터 섹션을 추출
    const spellDataSection = fileContent.substring(startIndex, currentIndex);

    return spellDataSection;
  } catch (error) {
    console.error("Error extracting spell data:", error);
    throw error; // 에러를 다시 던져서 호출하는 쪽에서 처리할 수 있게 함
  }
}

/**
 * 
 * @param spellDataSection   {
    "id": "SPELL_POISONOUS_CLOUD",
    "name": "Poisonous Cloud",
    "schools": [
      "conjuration",
      "alchemy",
      "air"
    ],
    "flags": [
      "target",
      "area",
      "needs_tracer",
      "cloud",
      "monster"
    ],
    "level": 5,
    "power": 200,
    "range": {
      "min": 5,
      "max": 5
    },
    "noise": 2,
    "tile": "TILEG_POISONOUS_CLOUD"
  }
 * @returns 
 */

type SpellData = {
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

function parseSpellData(spellDataSection: string) {
  const spells: SpellData[] = [];
  // 각각의 spell 블록을 매칭하는 정규식
  const spellRegex = /{\s*SPELL_[^}]+}/g;

  const matches = spellDataSection.match(spellRegex);
  if (!matches) return spells;

  matches.forEach((spellBlock) => {
    // AXED_SPELL 체크
    if (spellBlock.includes("AXED_SPELL")) {
      return; // skip this iteration
    }

    try {
      // 중괄호와 앞뒤 공백 제거
      const cleanBlock = spellBlock.replace(/^{\s*|\s*}$/g, "");
      // 각 줄을 배열로 분리
      const lines = cleanBlock.split(",").map((line) => line.trim());

      if (lines.length < 9) return; // 유효하지 않은 데이터는 건너뛰기

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

      spells.push(spell);
    } catch (error) {
      console.error("Error parsing spell block:", spellBlock, error);
    }
  });

  return spells;
}

function extractSpellName(nameStr: string) {
  const matches = nameStr.match(/"([^"]+)"/);
  return matches ? matches[1] : nameStr.trim();
}

function parseSchools(schoolsStr: string) {
  if (!schoolsStr) return [];
  return schoolsStr
    .split("|")
    .map((s) => s.trim().replace("spschool::", ""))
    .filter((s) => s !== "none");
}

function parseFlags(flagsStr: string) {
  if (!flagsStr) return [];
  return flagsStr
    .split("|")
    .map((f) => f.trim().replace("spflag::", ""))
    .filter((f) => f !== "none");
}

// 메인 실행 부분
try {
  const fileContent = fs.readFileSync(
    "src/data/spl-data.trunk.20240209.h",
    "utf8"
  );
  const spellDataSection = extractSpellData(fileContent);

  if (!spellDataSection) {
    throw new Error("Failed to extract spell data section");
  }

  const parsedSpells = parseSpellData(spellDataSection);
  const sortedSpells = parsedSpells.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  fs.writeFileSync(
    "src/data/parsed-spells.json",
    JSON.stringify(sortedSpells, null, 2)
  );
} catch (error) {
  console.error("Failed to process spell data:", error);
  process.exit(1);
}
