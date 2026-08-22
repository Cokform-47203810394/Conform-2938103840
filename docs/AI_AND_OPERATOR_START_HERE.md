# 콕폼 독립 운영 시작 안내서

이 파일은 **혼자 운영하는 대표, 새 협업자, 다른 AI**가 가장 먼저 읽는 짧은 진입점이다. 상세 내용은 링크된 기준 문서와 2,000개 매뉴얼에서 확인한다.

## 1. 5분 안에 현재 상태 파악하기

1. [`MASTER_CONTEXT_COKFORM_CURRENT.md`](./MASTER_CONTEXT_COKFORM_CURRENT.md)를 읽어 제품·보안·배포·미해결 상태를 파악한다.
2. [`transfer/RESTORE_AND_CONTINUE.md`](./transfer/RESTORE_AND_CONTINUE.md)로 새 환경 복구 순서를 확인한다.
3. [`operations-manuals/00-core-playbooks.md`](./operations-manuals/00-core-playbooks.md)로 절대 금지선을 확인한다.
4. [`operations-manuals/INDEX.csv`](./operations-manuals/INDEX.csv)에서 현재 역할·업무·상황에 맞는 세부 매뉴얼 ID를 찾는다.
5. 변경이 필요할 때만 관련 코드·가이드·테스트를 열고, 범위를 한 번에 하나로 제한한다.

## 2. 절대 하지 말 것

| 금지 | 이유 |
|---|---|
| 개인키, 복구 비밀번호, 키 백업, 실제 응답 원문을 받거나 기록 | E2EE 경계와 사용자 통제권을 깨뜨림 |
| 실제 `.env`, OAuth Client Secret, API 토큰을 Git·문서·채팅에 저장 | 계정·인프라 침해 위험 |
| 기존 응답이 있는 폼에 새 개인키 금고를 임의 생성 | 기존 응답을 복호화하지 못하게 될 수 있음 |
| 배포 성공을 사용자 검증 성공으로 표현 | 제품 가설은 사용 증거가 있어야 검증됨 |
| 기능 동결 중 새 기능을 쌓기 | 검증보다 빌드가 앞서는 문제를 반복함 |

## 3. 역할별 첫 문서

| 역할 | 먼저 읽을 문서 | 대표 업무 |
|---|---|---|
| 대표·창업가 | `operations-manuals/GOV-README.md` | 우선순위, 중단 기준, 비용, 파일럿 판단 |
| 기획가 | `operations-manuals/PRD-README.md` | 사용자 문제, 가설, 성공 기준, 범위 축소 |
| 디자이너 | `operations-manuals/UXD-README.md` | 모바일 흐름, 접근성, 문구, AI 티 제거 |
| 프런트엔드 개발자 | `operations-manuals/FEN-README.md` | React 상태·라우팅·자동저장·화면 회귀 |
| 백엔드 개발자 | `operations-manuals/BEN-README.md` | Supabase, RLS, RPC, Edge Function |
| 보안 담당자 | `operations-manuals/SEC-README.md` | E2EE, 키 금고, 복구, 비밀값 |
| QA | `operations-manuals/QAT-README.md` | 핵심 경로, 모바일, 재현, 배포 승인 |
| 운영·SRE | `operations-manuals/OPS-README.md` | 배포, 롤백, 장애, 서비스 상태 |
| 고객지원 | `operations-manuals/SUP-README.md` | 민감정보 없는 문제 분류와 안내 |
| 개인정보 담당자 | `operations-manuals/LEG-README.md` | 고지, 보관, 국외 처리, 요청 대응 |
| 마케터·SEO | `operations-manuals/MRK-README.md`, `SEO-README.md` | 한국 실무형 카피, 검색, OG, 채널 |
| 리서처·그로스 | `operations-manuals/RES-README.md`, `GRW-README.md` | 경쟁·문제 조사, 개인정보 없는 측정 |

## 4. 2,000개 매뉴얼을 찾는 법

매뉴얼은 `20개 도메인 × 10개 업무 흐름 × 10개 상황`으로 생성되어 있다.

```text
COK-{도메인}-{업무흐름번호}-{상황번호}
예: COK-SEC-03-06 = 보안·암호화·키 / 키 복구 테스트 / 장애 발생
```

상황 번호는 다음 순서다.

| 번호 | 상황 |
|---:|---|
| 01 | 정기 점검 |
| 02 | 신규 요청 |
| 03 | 실사용자 신고 |
| 04 | 배포 직전 |
| 05 | 배포 직후 |
| 06 | 장애 발생 |
| 07 | 보안 의심 |
| 08 | 개인정보 포함 가능성 |
| 09 | 파일럿 진행 |
| 10 | 월간 회고 |

`INDEX.csv`에서 역할·도메인·업무·상황을 검색한 뒤 해당 `manuals/{domain}/{ID}.md` 파일을 연다.

## 5. 매일·배포 전·장애 시 최소 행동

| 시점 | 꼭 할 일 |
|---|---|
| 매일 | GitHub Actions, Supabase 상태, 최근 사용자 오류를 확인한다. |
| 코드 변경 전 | 영향을 한 문장으로 적고 `git diff --check`와 관련 매뉴얼을 확인한다. |
| 배포 전 | `npm run build`, 핵심 사용자 경로, 롤백 기준을 확인한다. |
| 배포 후 | GitHub Actions 성공, 홈·편집기·공개 링크를 확인한다. |
| 장애·보안 의심 | 새 변경을 멈추고 `BCP`·`SEC` 매뉴얼을 연다. 데이터·암호문·권한을 추측으로 수정하지 않는다. |
| 고객 문의 | 비밀번호·개인키·키 백업·응답 원문을 받지 않는다. 폼 ID, 시각, 브라우저, 오류 문구만 받는다. |

## 6. 다른 AI에게 맡길 때의 기본 프롬프트

```text
콕폼 프로젝트를 안전하게 이어서 작업한다.
먼저 docs/AI_AND_OPERATOR_START_HERE.md와
MASTER_CONTEXT_COKFORM_CURRENT.md를 읽고,
현재 작업의 역할·업무·상황에 맞는 operations-manuals/INDEX.csv의 매뉴얼을 하나 찾는다.

개인키, 복구 비밀번호, 키 백업, 실제 응답 원문, 토큰, OAuth Client Secret을 요청하거나 기록하지 마라.
기능 동결 상태를 지키고, 새 기능보다 테스트·복구·접근성·개인정보 최소화·실사용 검증·명확한 버그 수정만 우선한다.
변경 전에는 git diff --check와 npm run build를, 변경 뒤에는 배포와 핵심 화면 검수를 완료한다.
```

## 7. 새 컴퓨터·새 세션으로 옮길 때

`transfer/RESTORE_AND_CONTINUE.md`를 따른다. 코드·문서·생성기·CI/CD·DB 마이그레이션·체크섬은 이식할 수 있지만, 실제 비밀값과 사용자 데이터는 대시보드·사용자 기기에서 별도로 연결해야 한다.
