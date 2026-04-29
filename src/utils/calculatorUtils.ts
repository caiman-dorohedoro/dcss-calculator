import { calculateEV } from "@/utils/evCalculation";
import { calculateMixedAC } from "@/utils/acCalculation";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { calculateSH } from "./shCalculation";
import {
  getAggregatedEquipmentEffects,
  getAmuletReflectionCount,
  getEffectiveEquipmentState,
} from "./equipmentModifiers";
import {
  getFormDefinition,
  getFormValue,
  getFormValueScaled,
} from "@/versioning/formData";
import {
  calculateSpellFailureRate,
  getSpellData,
  getSpellSchools,
  vehumetSupportsSpell,
} from "./spellCalculation";
import type { SpellCalculationParams } from "./spellCalculation";
import { GameVersion } from "@/types/game";
import { VersionedSchoolSkillLevels } from "@/types/spells";
import { spellCanBeEnkindled } from "./spellCanbeEnkindled";
import { getMutationStatModifiers } from "./statMutations";

type DataPoint = {
  dodgingSkill: number;
  baseEV: number;
  rawDodgeBonus: number;
  actualDodgeBonus: number;
  dodgeModifier: number;
  shieldPenalty: number;
  armourPenalty: number;
  finalEV: number;
};

type ACDataPoint = {
  armour: number;
  ac: number;
};

export const calculateAcData = <V extends GameVersion>(
  state: CalculatorState<V>
): ACDataPoint[] => {
  const gear = getAggregatedEquipmentEffects(state);
  const effectiveState = getEffectiveEquipmentState(state);
  const form = getFormDefinition(state.version, state.form);
  const formValueParams = {
    shapeshiftingSkill: state.shapeshiftingSkill ?? 0,
    experienceLevel: state.experienceLevel ?? 1,
    form,
  };
  const formAC = getFormValue(form.ac, formValueParams);
  const bodyArmourBaseAcMultiplier = getFormValue(
    form.bodyAcMult,
    formValueParams
  );
  const result = Array.from({ length: 271 }, (_, i) => i / 10).map(
    (_, index) => {
      const armour = index / 10;

      return {
        armour,
        ac: calculateMixedAC({
          version: state.version,
          species: state.species,
          armour: effectiveState.armour,
          bodyArmourEnchant: effectiveState.bodyArmourEnchant,
          headgearSlots: effectiveState.headgearSlots,
          gloveSlots: effectiveState.gloveSlots,
          helmet: effectiveState.helmet,
          gloves: effectiveState.gloves,
          boots: effectiveState.boots,
          bootsEnchant: effectiveState.bootsEnchant,
          cloak: effectiveState.cloak,
          cloakEnchant: effectiveState.cloakEnchant,
          cloakBaseAc:
            effectiveState.cloakItem.kind === "scarf" ? 0 : undefined,
          barding: effectiveState.barding,
          bardingEnchant: effectiveState.bardingEnchant,
          secondGloves: effectiveState.secondGloves,
          ringProtection: 0,
          equipmentAC: gear.ac,
          formAC,
          bodyArmourBaseAcMultiplier,
          scalesAC: state.scalesAC,
          deformedBody: state.deformedBody,
          icemail: state.icemail,
          sanguineArmour: state.sanguineArmour,
          statusAC: state.statusAC,
          activeStatusIds: state.activeStatusIds,
          armourSkill: armour,
        }),
      };
    }
  );

  return result;
};

export const calculateEvData = <V extends GameVersion>(
  state: CalculatorState<V>
): DataPoint[] => {
  const gear = getAggregatedEquipmentEffects(state);
  const mutationStats = getMutationStatModifiers(state);
  const effectiveState = getEffectiveEquipmentState(state);
  const form = getFormDefinition(state.version, state.form);
  const formValueParams = {
    shapeshiftingSkill: state.shapeshiftingSkill ?? 0,
    experienceLevel: state.experienceLevel ?? 1,
    form,
  };
  const formEVScaled = getFormValueScaled(form.ev, formValueParams);
  const result = Array.from({ length: 271 }, (_, i) => i / 10).map(
    (_, index) => {
      const dodgingSkill = index / 10;
      const calcResult = calculateEV({
        version: state.version,
        dodgingSkill,
        dexterity: state.dexterity + mutationStats.dex,
        equipmentDex: gear.dex,
        strength: state.strength + mutationStats.str,
        equipmentStr: gear.str,
        species: state.species,
        shield: effectiveState.shield,
        armour: effectiveState.armour,
        barding: effectiveState.barding,
        shieldSkill: state.shieldSkill,
        armourSkill: state.armourSkill,
        ringEvasion: 0,
        equipmentEV: gear.ev,
        distortionField: state.distortionField,
        tenguFlight: state.tenguFlight,
        sturdyFrame: state.sturdyFrame,
        gelatinousBody: state.gelatinousBody,
        slowReflexes: state.slowReflexes,
        statusEV: state.statusEV,
        effectiveSize: form.size,
        formEVScaled,
        evMultiplier: form.special?.statueEvMultiplier,
      });

      return {
        dodgingSkill: parseFloat(dodgingSkill.toFixed(1)),
        ...calcResult,
        dodgeModifier: parseFloat(calcResult.dodgeModifier.toFixed(2)),
      };
    }
  );

  return result;
};

export const calculateAcTicks = <V extends GameVersion>(
  state: CalculatorState<V>
): number[] => {
  const acData = calculateAcData(state);
  const acChangePoints = new Set<number>();

  let lastAC = 0;
  for (const dataPoint of acData) {
    if (dataPoint.ac !== lastAC && dataPoint.armour < 27) {
      acChangePoints.add(dataPoint.armour);
      lastAC = dataPoint.ac;
    }
  }

  return Array.from(acChangePoints);
};

export const calculateEvTicks = <V extends GameVersion>(
  state: CalculatorState<V>
): number[] => {
  const evData = calculateEvData(state);
  const evChangePoints = new Set<number>();

  let lastEV = 0;
  for (const dataPoint of evData) {
    if (dataPoint.finalEV !== lastEV && dataPoint.dodgingSkill < 27) {
      evChangePoints.add(dataPoint.dodgingSkill);
      lastEV = dataPoint.finalEV;
    }
  }

  return Array.from(evChangePoints);
};

export type SHDataPoint = {
  shield: number;
  sh: number;
};

export const calculateSHData = <V extends GameVersion>(
  state: CalculatorState<V>
): SHDataPoint[] => {
  const gear = getAggregatedEquipmentEffects(state);
  const mutationStats = getMutationStatModifiers(state);
  const effectiveState = getEffectiveEquipmentState(state);
  const form = getFormDefinition(state.version, state.form);
  const formValueParams = {
    shapeshiftingSkill: state.shapeshiftingSkill ?? 0,
    experienceLevel: state.experienceLevel ?? 1,
    form,
  };
  const bladeParry = getFormValue(form.special?.bladeParry, formValueParams);
  const amuletReflection = getAmuletReflectionCount(effectiveState.amuletSlots);
  const result = Array.from({ length: 271 }, (_, i) => i / 10).map(
    (_, index) => {
      const shield = index / 10;
      return {
        shield,
        sh: calculateSH({
          shield: effectiveState.shield,
          shieldSkill: shield,
          dexterity: state.dexterity + mutationStats.dex,
          equipmentDex: gear.dex,
          shieldEnchant: effectiveState.shieldEnchant,
          equipmentSH: gear.sh,
          amuletReflection,
          largeBonePlates: state.largeBonePlates,
          condensationShield: state.condensationShield,
          ephemeralShield: state.ephemeralShield,
          activeStatusIds: state.activeStatusIds,
          reckless: state.reckless,
          bladeParry,
        }),
      };
    }
  );

  return result;
};

export const calculateShTicks = <V extends GameVersion>(
  state: CalculatorState<V>
): number[] => {
  const shData = calculateSHData(state);
  const shChangePoints = new Set<number>();

  let lastSH = 0;
  for (const dataPoint of shData) {
    if (dataPoint.sh !== lastSH && dataPoint.shield < 27) {
      shChangePoints.add(dataPoint.shield);
      lastSH = dataPoint.sh;
    }
  }

  return Array.from(shChangePoints);
};

export type FristSchoolSFDataPoint = {
  spellSkill: number;
  spellFailureRate: number;
  spellFailureRange: [number, number];
  spellFailureRangeMin: number;
  spellFailureRangeMax: number;
  enKindledSpellFailureRate?: number;
  vehumetPreviewSpellFailureRate?: number;
};

const CRAWL_MAX_SKILL = 27;
const CRAWL_DISPLAY_SKILL_SCALE = 10;
const CRAWL_SPELL_SCHOOL_SCALE = 200;
const CRAWL_SPELLCASTING_SCALE = 50;

const getDisplayedSkillBucketBounds = (
  displayedSkill: number,
  calculationScale: number
): [number, number] => {
  const displayedUnits = Math.min(
    CRAWL_MAX_SKILL * CRAWL_DISPLAY_SKILL_SCALE,
    Math.max(0, Math.round(displayedSkill * CRAWL_DISPLAY_SKILL_SCALE))
  );
  const unitsPerDisplayedDecimal =
    calculationScale / CRAWL_DISPLAY_SKILL_SCALE;
  const lowerScaledSkill = displayedUnits * unitsPerDisplayedDecimal;
  const upperScaledSkill = Math.min(
    CRAWL_MAX_SKILL * calculationScale,
    lowerScaledSkill + unitsPerDisplayedDecimal - 1
  );

  return [
    lowerScaledSkill / calculationScale,
    upperScaledSkill / calculationScale,
  ];
};

export const calculateAvgSFData = <V extends GameVersion>(
  state: CalculatorState<V>
): FristSchoolSFDataPoint[] => {
  const gear = getAggregatedEquipmentEffects(state);
  const mutationStats = getMutationStatModifiers(state);
  const effectiveState = getEffectiveEquipmentState(state);
  const targetSpell = state.targetSpell;

  if (targetSpell === undefined) {
    throw new Error("Target spell not found");
  }

  const spellDifficulty = getSpellData<V>(state.version).find(
    (spell) => spell.name === targetSpell
  )?.level;

  if (spellDifficulty === undefined) {
    throw new Error("Spell difficulty not found");
  }

  if (state.targetSpell === undefined) {
    throw new Error("Target spell not found");
  }
  const spellSchools = getSpellSchools<V>(state.version, targetSpell);
  const shouldPreviewVehumet =
    state.god === "Vehumet" &&
    (state.godPietyRank ?? 0) < 3 &&
    state.godUnderPenance !== true &&
    vehumetSupportsSpell(state.version, targetSpell);
  const result = Array.from({ length: 271 }, (_, i) => i / 10).map(
    (_, index) => {
      const displayedSpellSkill = index / 10;
      const schoolSkills = spellSchools.reduce((acc, school) => {
        acc[school] = displayedSpellSkill;

        return acc;
      }, {} as VersionedSchoolSkillLevels<V>);

      const [schoolSkillMin, schoolSkillMax] = getDisplayedSkillBucketBounds(
        displayedSpellSkill,
        CRAWL_SPELL_SCHOOL_SCALE
      );
      const [spellcastingMin, spellcastingMax] =
        getDisplayedSkillBucketBounds(
          state.spellcasting ?? 0,
          CRAWL_SPELLCASTING_SCALE
        );
      const rangeMinSchoolSkills = spellSchools.reduce((acc, school) => {
        acc[school] = schoolSkillMax;

        return acc;
      }, {} as VersionedSchoolSkillLevels<V>);
      const rangeMaxSchoolSkills = spellSchools.reduce((acc, school) => {
        acc[school] = schoolSkillMin;

        return acc;
      }, {} as VersionedSchoolSkillLevels<V>);

      const baseSpellFailureParams: Omit<
        SpellCalculationParams<V>,
        "schoolSkills" | "spellcasting"
      > = {
        version: state.version,
        species: state.species,
        strength: state.strength + mutationStats.str,
        equipmentStr: gear.str,
        intelligence: state.intelligence + mutationStats.int,
        equipmentInt: gear.int,
        targetSpell: targetSpell,
        spellDifficulty,
        armour: effectiveState.armour,
        bodyArmourEgo:
          effectiveState.bodyArmour.ego ?? effectiveState.bodyArmourEgo,
        orb: effectiveState.orb,
        shield: effectiveState.shield,
        armourSkill: state.armourSkill,
        shieldSkill: state.shieldSkill,
        wizardry: gear.wizardry,
        ringWizardry: 0,
        bigBrainWizardry: state.bigBrainWizardry,
        subduedMagic: state.subduedMagic,
        antiWizardry: state.antiWizardry,
        runicMagic: state.runicMagic,
        sturdyFrame: state.sturdyFrame,
        wildMagic: state.wildMagic,
        god: state.god,
        godPietyRank: state.godPietyRank,
        godUnderPenance: state.godUnderPenance,
      };

      const spellFailureRate = calculateSpellFailureRate({
        ...baseSpellFailureParams,
        spellcasting: state.spellcasting ?? 0,
        schoolSkills,
      });
      const rangeMinCandidate = calculateSpellFailureRate({
        ...baseSpellFailureParams,
        spellcasting: spellcastingMax,
        schoolSkills: rangeMinSchoolSkills,
      });
      const rangeMaxCandidate = calculateSpellFailureRate({
        ...baseSpellFailureParams,
        spellcasting: spellcastingMin,
        schoolSkills: rangeMaxSchoolSkills,
      });
      const spellFailureRangeMin = Math.min(
        rangeMinCandidate,
        rangeMaxCandidate
      );
      const spellFailureRangeMax = Math.max(
        rangeMinCandidate,
        rangeMaxCandidate
      );

      const dataPoint = {
        spellSkill: displayedSpellSkill,
        spellFailureRate,
        spellFailureRange: [spellFailureRangeMin, spellFailureRangeMax] as [
          number,
          number,
        ],
        spellFailureRangeMin,
        spellFailureRangeMax,
      };

      const withVehumetPreview = shouldPreviewVehumet
        ? {
            ...dataPoint,
            vehumetPreviewSpellFailureRate: calculateSpellFailureRate({
              ...baseSpellFailureParams,
              spellcasting: state.spellcasting ?? 0,
              schoolSkills: schoolSkills,
              god: "Vehumet",
              godPietyRank: 3,
              godUnderPenance: false,
            }),
          }
        : dataPoint;

      if (
        state.species === "revenant" &&
        spellCanBeEnkindled(state.version, targetSpell)
      ) {
        const enKindledSpellFailureRate = calculateSpellFailureRate({
          ...baseSpellFailureParams,
          spellcasting: state.spellcasting ?? 0,
          schoolSkills: schoolSkills,
          enkindle: true,
        });

        return {
          ...withVehumetPreview,
          enKindledSpellFailureRate,
        };
      }

      return withVehumetPreview;
    }
  );

  return result;
};

export const calculateSFTicks = <V extends GameVersion>(
  state: CalculatorState<V>
): number[] => {
  const sfData = calculateAvgSFData<V>(state);
  const sfChangePoints = new Set<number>();

  const fibo = [1, 2, 3, 5, 8, 13, 21];
  let lastSpellFailureRate = 0;
  for (const dataPoint of sfData) {
    if (
      dataPoint.spellFailureRate <= 34 &&
      dataPoint.spellSkill < 27 &&
      fibo.includes(dataPoint.spellFailureRate)
    ) {
      if (dataPoint.spellFailureRate !== lastSpellFailureRate) {
        sfChangePoints.add(dataPoint.spellSkill);
        lastSpellFailureRate = dataPoint.spellFailureRate;
      }
    }
  }

  return Array.from(sfChangePoints);
};
