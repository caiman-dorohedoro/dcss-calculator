import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type SpeciesKey = 'little' | 'small' | 'medium' | 'large';
type ShieldKey = 'none' | 'buckler' | 'shield' | 'large_shield';

type DataPoint = {
  dodgeSkill: number;
  baseEV: number;
  rawDodgeBonus: number;
  actualDodgeBonus: number;
  dodgeModifier: number;
  shieldPenalty: number;
  armourPenalty: number;
  finalEV: number;
};

// Move these outside the component
const speciesOptions = {
  little: { name: '아주 작은 크기 (스프리건, 펠리드)', factor: 4 },
  small: { name: '작은 크기 (코볼드)', factor: 2 },
  medium: { name: '중간 크기 (대부분의 종족)', factor: 0 },
  large: { name: '큰 크기 (트롤, 나가 등)', factor: -2 },
} as const;

const shieldOptions = {
  none: { name: '없음', encumbrance: 0 },
  buckler: { name: '버클러', encumbrance: 5 },
  shield: { name: '카이트 실드', encumbrance: 10 },
  large_shield: { name: '타워 실드', encumbrance: 15 },
} as const;

// Add this type
type ChartDataKey = keyof DataPoint;

const EVCalculator = () => {
  const [dexterity, setDexterity] = useState(10);
  const [strength, setStrength] = useState(10);
  const [species, setSpecies] = useState<SpeciesKey>('medium');
  const [shield, setShield] = useState<ShieldKey>('none');
  const [armourER, setArmourER] = useState(0);
  const [shieldSkill, setShieldSkill] = useState(0);
  const [armourSkill, setArmourSkill] = useState(0);
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const calculateEV = () => {
      const newData = [];
      const sizeFactor = speciesOptions[species].factor;
      const baseEV = 10 + sizeFactor;
      const shieldEncumbrance = shieldOptions[shield].encumbrance;

      // Calculate for dodging skill 0 to 27
      for (let dodge = 0; dodge <= 27; dodge++) {
        // Calculate dodge bonus with armor penalty modifier
        const armorPenaltyForDodge = armourER - 3;
        let dodgeModifier = 1;

        if (armorPenaltyForDodge > 0) {
          if (armorPenaltyForDodge >= strength) {
            dodgeModifier = strength / (armorPenaltyForDodge * 2);
          } else {
            dodgeModifier = 1 - armorPenaltyForDodge / (strength * 2);
          }
        }

        // Calculate dodge bonus with two-step floor operation
        // Step 1: Calculate and floor the base dodge bonus
        const rawDodgeBonus = Math.floor((8 + dodge * dexterity * 0.8) / (20 - sizeFactor));

        // Step 2: Apply modifier and floor again
        const dodgeBonus = Math.floor(rawDodgeBonus * dodgeModifier);

        // Calculate initial EV with dodge bonus
        let currentEV = baseEV + dodgeBonus;

        // Shield penalty: -2/5 * encumbrance^2 / (str + 5) * ((27 - shield_skill) / 27)
        const shieldPenalty = Math.floor((2/5) * Math.pow(shieldEncumbrance, 2) / (strength + 5) * ((27 - shieldSkill) / 27));
        
        // Armour penalty: -1/225 * encumbrance^2 * (90 - 2 × armour_skill) / (str + 3)
        const armourPenalty = Math.floor((1/225) * Math.pow(armourER, 2) * (90 - 2 * armourSkill) / (strength + 3));

        // Apply penalties
        currentEV = Math.max(1, currentEV - shieldPenalty - armourPenalty);

        newData.push({
          dodgeSkill: dodge,
          baseEV,
          rawDodgeBonus,
          actualDodgeBonus: dodgeBonus,
          dodgeModifier: parseFloat(dodgeModifier.toFixed(2)),
          shieldPenalty,
          armourPenalty,
          finalEV: currentEV,
        });
      }
      setData(newData);
    };

    calculateEV();
  }, [dexterity, strength, species, shield, armourER, shieldSkill, armourSkill]);

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>EV 계산기</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              민첩성(Dexterity):
              <input
                type="number"
                min="1"
                max="40"
                value={dexterity}
                onChange={(e) => setDexterity(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-20"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              힘(Strength):
              <input
                type="number"
                min="1"
                max="40"
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-20"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              방패 스킬:
              <input
                type="number"
                min="0"
                max="27"
                value={shieldSkill}
                onChange={(e) => setShieldSkill(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-20"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              갑옷 스킬:
              <input
                type="number"
                min="0"
                max="27"
                value={armourSkill}
                onChange={(e) => setArmourSkill(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-20"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              종족 크기:
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as SpeciesKey)}
                className="ml-2 p-1 border rounded"
              >
                {Object.entries(speciesOptions).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              방패:
              <select
                value={shield}
                onChange={(e) => setShield(e.target.value as ShieldKey)}
                className="ml-2 p-1 border rounded"
              >
                {Object.entries(shieldOptions).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              갑옷 ER(Encumbrance Rating):
              <input
                type="number"
                min="0"
                max="300"
                value={armourER}
                onChange={(e) => setArmourER(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-20"
              />
            </label>
          </div>
        </div>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dodgeSkill" 
                label={{ value: '회피 스킬 레벨', position: 'bottom', offset: 5 }}
              />
              <YAxis 
                label={{ value: 'EV', angle: -90, position: 'left', offset: -10 }}
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value, name: ChartDataKey) => {
                  const labels: Record<ChartDataKey, string> = {
                    baseEV: '기본 EV',
                    rawDodgeBonus: '기본 회피 보너스',
                    actualDodgeBonus: '실제 회피 보너스',
                    dodgeModifier: '회피 수정자',
                    shieldPenalty: '방패 페널티',
                    armourPenalty: '갑옷 페널티',
                    finalEV: '최종 EV',
                    dodgeSkill: '회피 스킬'
                  };
                  return [`${value}`, labels[name]];
                }}
                labelFormatter={(value) => `회피 스킬 ${value}`}
              />
              <Legend 
                verticalAlign="bottom"
                align="center"
                layout="horizontal"
                wrapperStyle={{
                  paddingTop: '30px'
                }}
              />
              <Line
                type="stepAfter"
                dataKey="baseEV"
                name="기본 EV"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="finalEV"
                name="최종 EV"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="rawDodgeBonus"
                name="기본 회피 보너스"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="actualDodgeBonus"
                name="실제 회피 보너스"
                stroke="#ff8c00"
                strokeWidth={2}
                dot={false}
              />
              {shield !== 'none' && (
                <Line
                  type="stepAfter"
                  dataKey="shieldPenalty"
                  name="방패 페널티"
                  stroke="#ff7300"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {armourER > 0 && (
                <Line
                  type="stepAfter"
                  dataKey="armourPenalty"
                  name="갑옷 페널티"
                  stroke="#ff0000"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EVCalculator;