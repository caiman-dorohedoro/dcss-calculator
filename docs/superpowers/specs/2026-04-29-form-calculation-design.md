# Form-Aware Defense Calculation Design

작성일: 2026-04-29

## 배경

`dcss-tools`는 morgue에 적힌 AC, EV, SH 값을 그대로 보여주는 뷰어가 아니라, 종족, 스탯, 스킬, 장비, 변이, 상태를 기반으로 방어 수치를 다시 계산하는 계산기다. 따라서 imported morgue의 top-line `AC`, `EV`, `SH`는 검증 기준으로 사용할 수 있지만 계산 결과로 주입하면 안 된다.

최근 Triskal dragon-form morgue는 이 경계를 다시 드러냈다. `dcss-morgue-parser`는 `form: "dragon-form"`, `talismanDetails`, `equipState: "melded"` 장비를 모두 제공한다. 하지만 앱의 import/calculator 레이어는 form state를 계산 입력으로 보존하지 않고, talisman/form을 skipped summary로만 남긴다. 동시에 `melded` 장비를 일반 착용 장비처럼 import하기 때문에 Crawl의 실제 AC/EV/SH semantics와 어긋난다.

## Crawl Source 근거

Form 원본 데이터는 `crawl/crawl-ref/source/dat/forms/*.yaml`에 있고, `crawl/crawl-ref/source/util/form-gen.py`가 이를 `form-data.h`로 생성한다. 계산기에서 필요한 YAML 필드는 다음이다.

- `skill: {min, max}`: Shapeshifting skill scaling 구간
- `melds`: form이 막는 장비 슬롯
- `size`: EV body size override
- `str`, `dex`: form stat bonus
- `ac`, `ev`: form 자체 AC/EV bonus
- `body_ac_mult`: body armour base AC percentile modifier
- `changes_anatomy`, `changes_substance`: mutation suppression policy

`Form::raw_scaling_value`는 non-XL scaling을 다음 방식으로 계산한다.

```text
level = min(shapeshifting_skill, max_skill)
scaled_value = base * 100 + (level * 100 - min_skill * 100) * scaling / (max_skill - min_skill)
```

`xl_based` scaling은 skill 대신 XL을 사용한다.

```text
scaled_value = base * 100 + scaling * XL * 100 / 27
```

AC는 Crawl `player::base_ac`에서 melded equipment를 제외한 뒤 `get_form()->get_ac_bonus()`를 더한다. Body armour base AC에는 `get_form()->get_body_ac_mult()`가 적용된다. EV는 current form size를 `you.body_size(..., base = false)`로 읽고, form EV bonus를 더한다. Statue form은 natural EV에 `* 4 / 5`를 추가로 적용한다. SH에는 별도 YAML `sh` 필드는 없지만, offhand meld는 shield/orb를 제거하고 blade form은 parrying SH를 추가한다.

## Parser와 앱 책임 경계

Parser는 text extraction을 책임진다.

- 현재 form 이름
- talisman item snapshot
- 각 장비의 `equipState`
- top-line AC/EV/SH
- displayed skills

앱은 계산 의미론을 책임진다.

- `form`과 Shapeshifting skill로 form AC/EV/stat bonus 계산
- `melds` 또는 parser `equipState`로 장비 효과 제외
- form size를 EV/SH/spell penalty에 반영
- form이 anatomy/substance mutation을 suppress하는지 반영
- top-line AC/EV/SH는 regression assertion과 import warning에만 사용

## Goals

- Imported dragon-form Triskal morgue에서 calculator result가 `AC 18`, `EV 22`를 재현한다.
- Existing statue-form fixture가 top-line AC/EV에 근접하거나, 남은 차이가 명시적으로 분류된다.
- `record.form`, `record.effectiveSkills.shapeshifting`, `record.xl`, item `equipState`를 calculator state에 보존한다.
- AC, EV, SH, spell failure가 모두 같은 effective equipment model을 사용한다.
- Form support는 versioned data로 두어 trunk/stable 차이를 나중에 추적할 수 있게 한다.
- Imported morgue의 top-line defense values를 하드코딩하지 않는다.

## Non-Goals

- 모든 talisman UI를 한 번에 완성하지 않는다.
- Unarmed damage, HP multiplier, movement speed, breath damage, special form abilities는 이 작업 범위가 아니다.
- Crawl `form-gen.py`를 TypeScript로 완전히 이식하지 않는다.
- Parser package를 변경하지 않는다. 이번 문제는 parser 누락이 아니라 app-side interpretation 누락이다.
- Manual form selector UX를 첫 구현의 필수 조건으로 삼지 않는다. Imported morgue parity를 먼저 맞춘다.

## Recommended Approach

작은 versioned form data module을 추가하고, 계산기 내부의 장비 집계 함수를 form-aware로 확장한다.

이 접근은 `calculateAC`, `calculateEV`, `calculateSH`, `calculateSpellFailureRate`가 각자 ad hoc으로 melded 장비를 처리하는 것보다 안전하다. 장비가 form에 의해 meld되면 AC, EV penalty, SH, spell penalty, stat normalization에 모두 같은 방식으로 영향을 주기 때문이다.

## Data Model

`CalculatorState`에 다음 값을 추가한다.

- `form?: FormKey`
- `shapeshiftingSkill?: number`
- `experienceLevel?: number`

장비 item state에는 parser equip state를 보존한다.

- `equipState?: "worn" | "haunted" | "melded" | "installed"`

Form data는 version registry에서 접근 가능한 구조로 둔다.

```ts
type FormScaling = {
  base?: number;
  scaling?: number;
  xlBased?: boolean;
};

type FormDefinition = {
  key: FormKey;
  minSkill: number;
  maxSkill: number;
  melds: EquipmentMeldGroup[];
  size?: Size;
  strMod?: number;
  dexMod?: number;
  ac?: FormScaling;
  ev?: FormScaling;
  bodyAcMult?: FormScaling;
  changesAnatomy?: boolean;
  changesSubstance?: boolean;
  special?: {
    dragonDraconianAcPenalty?: number;
    statueEvMultiplier?: { numerator: number; denominator: number };
    bladeParry?: FormScaling;
  };
};
```

## Effective Equipment Model

계산 전 단계에서 state와 form을 받아 effective equipment를 계산한다.

- parser가 `equipState: "melded"`로 표시한 item은 계산에서 제외한다.
- form `melds`가 특정 slot을 막으면 해당 slot item은 계산에서 제외한다.
- `physical`은 Crawl `form-gen.py` 기준으로 weapon, offhand, body, helmet, gloves, boots, barding, cloak을 포함한다.
- `held`는 weapon과 offhand를 포함한다.
- `aux`는 helmet, gloves, boots, barding, cloak을 포함한다.
- `jewellery`는 ring과 amulet을 포함한다.
- `all`은 physical plus jewellery를 포함한다.

이 모델은 display state를 지우지 않는다. UI에는 melded item을 계속 보여줄 수 있지만, 계산에는 effective equipment만 들어간다.

## AC Calculation

AC는 기존 formula에 다음을 추가한다.

- effective body armour/aux armour만 base AC와 enchant를 적용한다.
- body armour base AC에는 `bodyAcMult`를 적용한다.
- form AC bonus를 추가한다.
- dragon form draconian AC penalty는 Crawl처럼 form AC에서 `6`을 뺀다.
- `changesAnatomy` 또는 `changesSubstance`로 suppress된 mutation AC는 제외한다.

Dragon form example:

- Troll Shapeshifting 25
- `dragon.yaml`: `ac {base: 12, scaling: 6}`, `min 17`, `max 25`
- form AC = `18`
- physical equipment melded, anatomy AC mutations suppressed
- expected AC = `18`

## EV Calculation

EV는 기존 formula에 다음을 추가한다.

- species size 대신 effective body size를 사용한다.
- form EV bonus를 natural EV에 더한다.
- effective body armour/shield/aux penalty만 적용한다.
- form stat bonus를 포함한 effective Str/Dex를 사용한다.
- statue form은 natural EV에 `* 4 / 5`를 적용한다.

Dragon form example:

- Troll base size `large` 대신 form size `giant`
- giant base EV = `6`
- effective Dex `11`, Dodging `17.3`, EV gear `+10`
- no body armour/shield/aux penalty
- expected EV = `22`

## SH Calculation

SH는 effective offhand model을 사용한다.

- offhand meld 시 shield/orb는 없는 것으로 계산한다.
- melded shield enchant, shield ego, shield SH artifact modifier는 제외한다.
- melded jewellery의 reflection/shielding modifier도 제외한다.
- blade form은 Crawl `player_parrying()`의 form contribution을 추가한다.

첫 구현은 imported defense parity에 필요한 offhand meld 처리와 gear exclusion을 우선한다. Blade parrying은 별도 fixture가 생기면 같은 form data helper로 추가한다.

## Spell Failure Interaction

Form 자체가 spell failure를 직접 바꾸는 것보다, form이 장비와 스탯을 바꾸는 효과가 중요하다.

- melded body armour는 armour spell penalty에서 제외된다.
- melded shield/orb는 shield spell penalty와 orb success boost에서 제외된다.
- form stat bonus는 effective Strength/Intelligence normalization에 반영해야 한다.
- body armour ego spell boosts는 item이 effective일 때만 적용된다.

Imported morgue에서는 displayed stat이 이미 form stat bonus와 equipped item stat bonus를 포함한다. Base stat normalization은 item modifiers뿐 아니라 form stat modifiers도 빼야 한다.

## Import Mapping

`buildImportedCalculatorState`는 다음을 수행한다.

- `record.form`을 state에 저장한다.
- `record.effectiveSkills.shapeshifting`을 state에 저장한다.
- `record.xl`을 state에 저장한다.
- item snapshots의 `equipState`를 item state에 저장한다.
- form/talisman skipped summary는 “not modeled”가 아니라 “modeled for defenses” 또는 남은 unsupported field만 보여준다.
- unsupported form일 경우 top-line parity가 불가능하다는 warning을 유지한다.

## Testing Strategy

Use test-first implementation.

- Add unit tests for form scaling at skill min, midpoint, max, and XL-based forms.
- Add unit tests for form meld slot expansion.
- Add AC regression for Triskal dragon-form: `AC 18`.
- Add EV regression for Triskal dragon-form: `EV 22`.
- Add regression for existing statue-form fixture to expose current gap before implementation.
- Add spell-failure smoke test proving melded body armour/shield no longer apply penalties.
- Add saved-state validation/default-state tests for new optional fields.

The regression tests should compare calculator output to morgue top-line values only after deriving state from parser output. They should never assign `record.ac`, `record.ev`, or `record.sh` into calculator output.

## Rollout Plan

1. Add form data and pure form helper tests.
2. Extend state/defaults/persistence for form, XL, Shapeshifting, and equip state.
3. Preserve form/equip state during morgue import.
4. Introduce effective equipment aggregation.
5. Wire AC calculation.
6. Wire EV calculation.
7. Wire SH and spell-failure equipment exclusion.
8. Replace “Form not modeled” import summary with precise support messaging.
9. Document maintenance notes in `docs/operations/versioning-workflow.md`.

This order keeps each change testable and avoids hiding formula changes behind import changes.
