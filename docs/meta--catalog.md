# 메타 카탈로그

작성일: 2026-04-05  
최종 업데이트: 2026-04-10

## 목적

- 현재 프로젝트 `dcss-tools`의 문서 위치와 유지보수 엔트리포인트를 한곳에서 관리한다.
- 다른 저장소에서 가져온 문서는 현재 프로젝트 맥락으로 정리된 뒤에만 남긴다.

## 프로젝트 개요

- 앱 성격: DCSS 주문 실패율, EV, AC, SH 계산기
- 기술 스택: Vite, React, TypeScript
- 지원 버전: `0.32`, `0.33`, `0.34`, `trunk`
- 유지보수 핵심 축: 버전별 데이터 스냅샷, version registry, 계산식 회귀 테스트

## 경로 및 네이밍 규칙

- 루트 문서: `README.md`, `AGENTS.md`
- 운영 문서: `docs/operations/<topic>.md`
- 릴리즈 대 trunk 감사 문서: `docs/operations/crawl-<stable>-to-trunk-audit.md`
- 설계 문서: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- 구현 계획: `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`
- 원본 Crawl 헤더: `src/data/spl-data.<version>.h` 또는 `src/data/spl-data.trunk.<yyyymmdd>.h`
- 생성 산출물: `src/data/generated-spells.<version>.json`, `src/types/generated-spells.<version>.d.ts`
- 로컬 유지보수 스크립트: `src/scripts/<action><Target>.ts`
- 일회성 메모는 새 루트 문서로 늘리지 말고, 장기 참조 가치가 있을 때만 `docs/` 아래에 추가한다.

## 현재 문서 카탈로그

| 파일명 | 설명 | 위치 |
| --- | --- | --- |
| `README.md` | 앱 소개, 배포 링크, 지원 버전, 유지보수 문서 진입점 | `/` |
| `AGENTS.md` | 에이전트용 프로젝트 작업 규칙과 검증/문서화 기준 | `/` |
| `meta--catalog.md` | 현재 문서와 핵심 유지보수 엔트리포인트를 정리한 메타 인덱스 | `/docs` |
| `versioning-workflow.md` | DCSS 버전 추가/갱신 시 따라야 하는 파일, 스크립트, 검증 절차 | `/docs/operations` |
| `crawl-0.34.1-to-trunk-audit.md` | `0.34.1` stable 대비 trunk 차이, 반영 범위, 후속 이슈를 기록한 감사 문서 | `/docs/operations` |
| `2026-04-04-version-registry-design.md` | version registry 레이어 도입 범위와 경계를 정리한 설계 문서 | `/docs/superpowers/specs` |
| `2026-04-04-version-registry-refactor.md` | version registry 리팩터링 구현 계획 | `/docs/superpowers/plans` |
| `2026-04-05-034-trunk-version-update-design.md` | `0.34` stable + trunk snapshot 갱신 범위를 정리한 설계 문서 | `/docs/superpowers/specs` |
| `2026-04-10-morgue-import-design.md` | morgue 붙여넣기 기반 calculator 자동 할당과 import summary 흐름을 정의한 설계 문서 | `/docs/superpowers/specs` |
| `2026-04-05-034-trunk-version-update.md` | `0.34.1 -> trunk` 갱신 구현 계획과 검증 순서 | `/docs/superpowers/plans` |
| `2026-04-10-morgue-import.md` | morgue import feature 구현을 위한 TDD 기반 실행 계획 | `/docs/superpowers/plans` |
| `2026-04-10-morgue-import-followups.md` | phase 1 이후 morgue parser 기반 확장 포인트와 우선순위를 정리한 후속 메모 | `/docs/superpowers/plans` |

## 핵심 유지보수 엔트리포인트

| 경로 | 역할 |
| --- | --- |
| `/package.json` | 개발, 빌드, 테스트, 데이터 추출 스크립트 정의 |
| `/src/scripts/extractSpellDataHeader.ts` | raw Crawl 헤더를 versioned spell JSON 및 타입 파일로 생성하는 스크립트 |
| `/src/scripts/reportVersionDiff.ts` | 두 버전 사이 주문/종족 차이를 출력하는 리포트 스크립트 |
| `/src/versioning/versionRegistry.ts` | 버전별 주문 데이터, 종족 데이터, defaults, feature flags, formula profile 등록 지점 |
| `/src/versioning/speciesData.ts` | 버전별 종족 목록과 옵션 정의 |
| `/src/versioning/defaultState.ts` | 버전별 calculator 초기 상태 생성 |
| `/src/versioning/uiOptions.ts` | 버전별 장비 토글 노출 규칙 |
| `/src/versioning/formulaProfiles.ts` | spell fail cap 등 계산식 프로필 정의 |
| `/src/utils/` | AC, EV, SH, spell failure 계산 구현과 회귀 테스트가 묶이는 영역 |
| `/src/data/` | raw spell header와 generated spell JSON을 보관하는 데이터 저장소 |

## 최근 기준 스냅샷

- 최신 stable audit 문서: `docs/operations/crawl-0.34.1-to-trunk-audit.md`
- 최신 trunk raw header snapshot: `src/data/spl-data.trunk.20260405.h`
- 최신 trunk 회귀 테스트: `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`, `src/utils/__tests__/spellCalculations.trunk-20260405-grandjackal.test.ts`, `src/utils/__tests__/spellCalculations.trunk-20260405-revenant.test.ts`
- 새 버전 작업을 시작할 때는 `docs/operations/versioning-workflow.md`를 먼저 읽고, 문서, 스크립트, registry, 회귀 테스트를 같은 작업 범위 안에서 같이 갱신한다.
