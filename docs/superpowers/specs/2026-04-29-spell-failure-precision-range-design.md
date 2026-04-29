# Spell Failure Precision Range Design

작성일: 2026-04-29

## 배경

`dcss-tools`의 spell failure 패널은 morgue 파일에 적힌 결과값을 다시 보여주는 뷰어가 아니라, 사용자가 입력한 종족, 스탯, 스킬, 장비, 신앙, 상태를 기반으로 실패율을 계산하는 계산기다. 따라서 imported morgue에 `failurePercent`가 있더라도 그 값을 계산 결과로 사용하면 안 된다.

이전 시행착오의 핵심 원인은 morgue의 스킬 표시 정밀도와 Crawl 내부 계산 scale이 다르다는 점이었다. 예를 들어 덤프에는 `Air 3.3`처럼 1자리 소수로 보이지만, spell failure 계산은 더 높은 scale의 정수 스킬 값을 사용한다. 그래서 앱이 `3.3`을 정확한 내부값처럼 계산하면 어떤 케이스에서는 Crawl 화면의 실패율과 1-2%p 정도 차이날 수 있다.

## Crawl Source 기준

Crawl의 chardump는 스킬을 `you.skill(skill, 10, true) * 0.1` 형태로 1자리 소수로 출력한다. `player::skill(skill, scale)`은 실제 스킬 정수와 진행도를 해당 scale로 변환하고, 진행도 부분은 정수 나눗셈으로 계산된다. 즉 덤프의 `3.3`은 반올림된 값이 아니라 1자리 표시 bucket이다.

반면 spell failure 계산에서 주문 학교 스킬은 `you.skill(..., 200)` scale을 사용하고, Spellcasting 보너스는 `you.skill(SK_SPELLCASTING, 50)` scale을 사용한다. armour/shield spell penalty는 `you.skill(..., 10)` scale을 사용하므로 morgue의 1자리 스킬 표시와 같은 scale이다.

결과적으로 hidden precision 문제는 주로 주문 학교 스킬과 Spellcasting에서 생긴다.

## 표시값과 가능한 내부 범위

덤프에 보이는 `Air 3.3`은 school scale 200 기준으로 다음 범위를 의미할 수 있다.

- displayed skill: `3.3`
- chardump scale 10 value: `33`
- spell school scale 200 possible values: `660..679`
- decimal equivalent for the calculator model: `3.300..3.395`

Spellcasting의 경우 spell failure 계산 scale이 50이므로 `Spellcasting 7.3`은 `365..369`, 즉 `7.30..7.38` 범위가 될 수 있다.

이 정보만으로 정확한 내부값 하나를 복원할 수는 없다. imported morgue의 1-decimal skill은 앞으로도 단일 계산 입력으로만 취급하고, Crawl 화면의 `failurePercent`를 정답처럼 주입하지 않는다.

## 그래프 표현 정책

그래프에는 두 가지 정보를 함께 보여준다.

- `Current failure`: 기존 앱 계산값. 현재 입력된 1-decimal 스킬을 정확한 값처럼 넣어 계산한 단일 선이다.
- `Precision range`: Crawl 덤프의 1-decimal skill이 실제 내부 scale에서 가질 수 있는 실패율 범위다.

예를 들어 JaaP morgue의 `Swiftness`, `Air 3.3`, `Spellcasting 7.3` 케이스에서 앱의 단일 계산값은 `65%`지만, Crawl 내부 school scale 200 범위를 고려하면 가능한 실패율 범위는 `63..65%`다. 실제 morgue의 `63%`는 이 range 안에 있으므로 계산식 자체가 틀렸다고 보지 않는다.

현재 구현은 기존 graph model을 유지한다. 다중 학교 주문의 x축은 기존처럼 대상 학교들이 모두 같은 `Skill Average` 값을 갖는 가상 선이다. Precision range도 이 같은 graph model 안에서 각 학교가 해당 0.1 bucket 안에 있을 때의 범위를 표시한다.

## 테스트 정책

계산식 자체를 검증하는 회귀 테스트는 여전히 `calculateSpellFailureRate`의 단일 결과를 사용한다. 다만 imported morgue fixture에서 스킬이 1자리 소수로만 주어진 케이스는 다음처럼 분류한다.

- 정확히 일치하면 기존 exact assertion 유지
- 1-decimal hidden precision 때문에 벗어나는 케이스는 `Precision range` 안에 들어오는지 확인
- morgue의 `failurePercent`를 앱 상태나 계산 결과로 하드코딩하지 않음

이 정책은 앱의 목적을 유지한다. 앱은 Crawl 결과를 복사해서 보여주는 것이 아니라, 가능한 한 Crawl source 계산식을 재현하고, 입력 precision의 한계가 있을 때 그 불확실성을 UI에 드러낸다.
