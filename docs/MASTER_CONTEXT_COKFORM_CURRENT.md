# Cokform 마스터 컨텍스트 — 현재 기준

**기준일:** 2026-08-22 KST  
**문서 성격:** 이식·인수인계용 단일 기준 문서  
**첫 독자:** 다음 AI, 새 협업자, 미래의 운영자  
**원칙:** 이 문서는 비밀값, 개인키, 복구 비밀번호, 키 백업, 실제 응답 원문, 사용자 식별자, 브라우저 세션을 포함하지 않는다.

> 콕폼은 **한국 실무 운영자가 자기 방식대로 접수·분류·마감하는 폼 도구**다. 고객의 자유도를 최우선으로 두되, 응답 원문은 폼 작성자만 읽을 수 있도록 E2EE 경계를 지킨다.

## 1. 먼저 지켜야 할 결정

| 우선순위 | 지켜야 할 내용 |
|---:|---|
| 1 | 사용자가 질문·순서·조건·고지·마감·운영 흐름을 직접 결정한다. |
| 2 | 개인키와 응답 원문은 서비스 운영자, Supabase, Cloudflare가 읽을 수 없어야 한다. |
| 3 | 한국어·모바일·행사·교육·커뮤니티 운영의 실제 업무를 먼저 해결한다. |
| 4 | Cloudflare Pages와 Supabase 무료 구간 중심으로 월 1만 원 이하의 고정비를 유지한다. |
| 5 | 보안·법무·한 사람 1회 제한을 과장하지 않는다. 모르는 사실은 확인 전까지 단정하지 않는다. |

현재는 **기능 확장 동결 상태**다. 새 템플릿, 질문 유형, 로그인 방식, 결제, PRO 기능, 대형 통합을 추가하지 않는다. 테스트, 키 복구, 접근성, 개인정보 최소화, 파일럿 검증, 측정, 명확한 버그 수정만 우선한다.

## 2. 서비스와 배포 상태

| 항목 | 현재 기준 |
|---|---|
| 운영 URL | `https://cokform.pages.dev` |
| 코드 저장소 | `Cokform-47203810394/Conform-2938103840` |
| 기본 브랜치 | `main` |
| 현재 기준 커밋 | `f58c542` — 편집 초안 보존 |
| 배포 경로 | GitHub Actions → Cloudflare Pages Direct Upload |
| 최근 배포 상태 | `f58c542` 기준 Cloudflare Pages 배포 성공 확인 |
| 데이터베이스 | Supabase PostgreSQL, 프로젝트 `bnbdxcyarerrmijuvxdb`, Seoul 리전 |
| 작성자 인증 | Supabase Auth의 Google OAuth |
| 공개 응답 | 로그인 없이 `?respond={formId}` 경로로 작성 가능 |
| 프런트엔드 | React 18, Vite 8, Tailwind CSS 3, Lucide React |
| 주요 의존성 | Supabase JS, Web Crypto API, `xlsx`, `pptxgenjs` |

## 3. 코드 지도

| 영역 | 주요 파일 | 책임 |
|---|---|---|
| 앱 진입·라우팅 | `src/App.jsx` | pathname/query 기반 SPA 라우팅, 편집 폼 복귀, Google Drive OAuth 복귀 |
| 편집기 | `src/pages/FormEditorPage.jsx` | 질문 편집, 자동저장, 버전, 공유, 운영 설정, 응답 탭, 복구 초안 |
| 공개 응답 | `src/pages/RespondPage.jsx`, `src/components/PreviewForm.jsx` | 로그인 없는 응답, 조건부 질문, E2EE 제출 |
| 응답 운영 | `src/components/ResponsesView.jsx` | 응답자별 상세, 처리 상태, 검색, 내보내기 |
| 조건부 질문 | `src/lib/conditionalQuestions.js` | 공개 폼과 응답 상세에서 동일한 표시 규칙 사용 |
| 암호화·키 금고 | `src/lib/secureResponses.js` | ECDH P-256, AES-GCM, PBKDF2 600,000회, 키 백업·복구·탭 복원 |
| 폼·응답 저장소 | `src/lib/formsStore.js` | Supabase 동기화, 버전, 감사, 폼·응답 CRUD |
| Google Drive | `src/lib/googleDriveExport.js`, `src/lib/auth.js` | `drive.file` 최소 권한, Drive 파일 업로드 |
| 제출 Edge Function | `supabase/functions/submit-e2ee-response/index.ts` | E2EE 봉투 검증, honeypot, 체류 시간, HMAC 속도 제한 |
| DB·RLS | `supabase/migrations/` | 테이블, RLS, RPC, 정리 작업 |
| 배포 | `.github/workflows/cloudflare-pages.yml` | GitHub push 후 Cloudflare Pages 배포 |
| 백업·유지 | `.github/workflows/supabase-encrypted-backup.yml`, `supabase-heartbeat.yml` | 암호화 백업과 Supabase 활동 유지 |

## 4. E2EE와 복구 경계

- 폼마다 ECDH P-256 키쌍을 만든다.
- 서버에는 공개키와 암호화된 응답 봉투만 저장한다.
- 응답 암호화는 임시 ECDH와 AES-256-GCM을 사용하며 AAD는 폼 ID·목적에 묶인다.
- 개인키 금고는 브라우저에서 PBKDF2-HMAC-SHA256 600,000회와 AES-256-GCM으로 보호한다.
- 개인키, 복구 비밀번호, 키 백업, 전체 복구 번들은 서버·로그·지원 대화·분석 도구에 넣지 않는다.
- 기존 공개키가 있는 폼에서 현재 기기에 맞는 개인키가 없으면 **새 키 금고를 만들면 안 된다.** 기존 응답을 열 수 없게 될 수 있다.

### 같은 탭 복원 동작

새로고침은 더 이상 편집기 이탈이나 반복 비밀번호 입력을 유발하지 않아야 한다.

| 상황 | 기대 동작 |
|---|---|
| 편집 중 새로고침 | 마지막 편집 폼으로 복귀 |
| 같은 탭에서 이미 금고를 열었음 | 비추출형 `CryptoKey` 세션 복원 후 응답·버전 기록 재개 |
| `지금 잠그기` | 메모리와 탭 세션 키 캐시 삭제 |
| 탭·브라우저 종료 또는 다른 기기 | 복구 비밀번호 또는 사용자 보관 키 백업 필요 |

탭 복원은 비밀번호나 JWK 원문을 평문으로 저장하지 않는다. 단, 같은 탭에서 사용할 수 있도록 브라우저의 비추출형 키 객체를 세션 핸들로 참조한다. 이 설계 변경은 향후 실제 브라우저 복구 테스트가 필요하다.

## 5. 저장·배포 갱신 시 데이터 보존

`FormEditorPage.jsx`는 편집 화면의 변경을 즉시 반영하고, 다음 두 단계로 유실을 줄인다.

1. 현재 폼 구조를 탭 저장소에 즉시 미러링한다. 응답 원문과 개인키는 포함하지 않는다.
2. 400ms 디바운스로 서버 자동저장을 수행한다. 저장 요청은 직렬화되어 오래된 저장이 새 편집을 덮어쓰지 않는다.

새로고침, 탭 비가시화, 페이지 이탈, 배포 중 오래된 청크 오류가 발생해도 탭 초안을 우선 복구한 뒤 다시 저장한다. 저장 성공 뒤 해당 초안은 정리하고, 실패하면 다음 복구를 위해 남긴다.

## 6. 조건부 질문과 로폴더 모집 폼

로폴더 팀원 모집 폼은 개발·관리·마케팅·리서칭팀을 지원한다. 팀 선택에 따라 해당 팀 심화 질문만 공개 폼과 응답 상세에 표시되어야 한다.

| 항목 | 현재 상태 |
|---|---|
| 조건 소스 질문 | `희망 지원 팀` |
| 팀별 심화 구성 | 각 팀 섹션 1개 + 질문 10개 |
| 공개 모바일 검수 | 390px 기준 가로 넘침 없음, 네 팀 모두 전용 질문만 표시 |
| 응답 상세 | 공통 질문 + 선택 팀 질문만 표시 |
| 회귀 스크립트 | `scripts/test_conditional_response_visibility.mjs` |

폼 ID, 키 백업 파일, 실제 응답값은 인수인계 문서에 기록하지 않는다. 필요한 경우 작성자가 자신의 콕폼 계정과 브라우저에서 확인한다.

## 7. Google OAuth와 Drive 내보내기

일반 Google 로그인은 프로필·이메일 권한만 요청한다. Drive 연결은 사용자가 내보내기 메뉴에서 `Google Drive 연결`을 눌렀을 때만 `https://www.googleapis.com/auth/drive.file` 범위를 요청한다. 이 범위는 Drive 전체 읽기 권한이 아니라 앱이 만들거나 사용자가 선택한 파일 범위의 권한이다.

### 현재 확인이 필요한 운영 설정

최근 Drive 연결에서 `403 access_denied` 및 업로드 권한 오류가 관찰됐다. 다음은 **코드가 아니라 Google Cloud Console에서 확인할 운영 작업**이다.

1. Supabase에 등록된 Google OAuth Client ID가 생성된 기존 Google Cloud 프로젝트를 연다.
2. OAuth 동의 화면의 대상이 External·Testing이라면 실제 테스트 계정을 `테스트 사용자`에 추가한다.
3. 동일 프로젝트에서 Google Drive API를 활성화한다.
4. OAuth 클라이언트의 승인된 리디렉션 URI에 `https://bnbdxcyarerrmijuvxdb.supabase.co/auth/v1/callback`이 있는지 확인한다.
5. 새 Google Cloud 프로젝트로 옮길 경우에만 새 Client ID·Secret을 발급하고 Supabase Authentication의 Google 제공자 값을 함께 교체한다.

`ResponsesView.jsx`는 이제 401(세션 만료), 403 API 미활성화, 기타 403 권한 거부를 서로 다른 문구로 보여준다. 실제 Drive 업로드 재검증은 API 활성화 후 수행해야 한다.

## 8. 최근 변경 이력

| 커밋 | 내용 |
|---|---|
| `f58c542` | 폼 편집 구조 초안을 탭에 즉시 보존해 갱신·새로고침 중 유실 방지 |
| `7760066` | 마지막 편집 폼 복귀와 동일 탭 개인키 세션 복원 |
| `f041aea` | Google Drive 401/403 오류를 원인별로 구분 |
| `195ed4f` | 응답 상세에서 선택하지 않은 팀 조건부 질문 숨김 |
| `7779b6c` | 소개 이미지의 소개글 위 배치 지원 |
| `0a214a4` | 로컬 전용 이스터에그와 `/after-hours` 문서 |
| `5add53b` | 홈·응답·404 오류 복구 UX |
| `b6658dd` | Discord 스타일 Markdown, 설명 폰트·굵기·정렬 |
| `3688240` | 리치 텍스트 탭 전환·페이지 이동 중 유실 방지 |

## 9. 법무·개인정보의 현재 한계

공개 문서는 `/privacy`, `/terms`, `/international-transfer`, `/service-restrictions`, `/business-info`, `/docs`, `/resources`, `/sitemap`에 있다. 다만 실제 사업자 정보, 개인정보보호책임자, 사업자등록번호, 대표자명, 사업장 주소, Cloudflare·Google 처리지역·계약 근거는 사업자 등록 및 법률 검토 뒤 확정해야 한다.

> 공개 배포가 곧 법적 완결을 뜻하지 않는다. 개인정보를 실제로 받는 운영 전에는 고지와 운영 사실을 다시 확인해야 한다.

## 10. 운영 문서와 2,000개 매뉴얼

| 시작점 | 용도 |
|---|---|
| `docs/OPERATIONS_MANUAL_SYSTEM.md` | 매뉴얼 체계의 사람용 입구 |
| `docs/operations-manuals/00-core-playbooks.md` | 모든 역할이 먼저 읽는 절대 원칙 |
| `docs/operations-manuals/INDEX.csv` | 20개 도메인 × 10개 흐름 × 10개 상황 = 2,000개 항목 검색표 |
| `docs/operations-manuals-source/` | 역할 플레이북·핵심 체크리스트·복사 템플릿 |
| `scripts/generate_manual_system.py` | 2,000개 생성 파일 재생성기 |
| `docs/transfer/` | 안전한 이식·복구·파일 무결성 자료 |

역할은 창업가, 기획가, 디자이너, 프런트엔드·백엔드 개발자, 보안, QA, 운영, 데이터, 고객지원, 법무, 재무, 마케팅, SEO, 그로스, 커뮤니티, 리서치, 위기대응으로 나뉜다. 매뉴얼 ID는 `COK-{도메인}-{흐름}-{상황}` 형식이다.

## 11. 다음 우선순위

1. 테스트 러너와 핵심 회귀 테스트를 정식으로 도입한다.
2. 키 백업 온보딩과 다른 환경 복구를 실제로 검증한다.
3. Google Drive API 활성화 뒤 Drive 연결·업로드를 실제로 재검증한다.
4. 개인정보 없는 행동 분석 이벤트를 설계한다.
5. 실제 원문을 받지 않는 컨시어지 파일럿 3회로 재사용 증거나 거절 이유를 수집한다.

## 12. 새 환경에서 이어가기

```bash
# 1. 코드 받기
gh repo clone Cokform-47203810394/Conform-2938103840
cd Conform-2938103840

# 2. 설치·빌드
npm ci
npm run build

# 3. 안전한 이식 검증
python3 scripts/verify_transfer_inventory.py

# 4. 현재 상태 확인
git status --short
git log --oneline -12
gh run list --workflow cloudflare-pages.yml --limit 3
```

실제 `.env`, OAuth Client Secret, Cloudflare API 토큰, GitHub 토큰, Supabase 서비스 역할 키, 개인키, 복구 파일, 실제 응답은 저장소나 이 문서에 넣지 않는다. 새 환경에서는 각 서비스 대시보드에서 다시 연결한다.

## 13. 다음 AI에게 붙여넣을 시작 프롬프트

```text
Cokform 프로젝트를 이어서 작업한다.
먼저 docs/MASTER_CONTEXT_COKFORM_CURRENT.md,
docs/OPERATIONS_MANUAL_SYSTEM.md,
docs/operations-manuals/00-core-playbooks.md,
docs/validation-freeze-and-readiness-2026-08.md,
docs/transfer/RESTORE_AND_CONTINUE.md를 읽어라.

개인키, 복구 비밀번호, 키 백업, 실제 응답 원문, OAuth 비밀값, 토큰을 요청·로그·문서에 넣지 마라.
현재는 기능 동결 상태다. 테스트·복구·접근성·개인정보 최소화·측정·실사용 검증·명확한 버그 수정 외의 새 기능을 추가하지 마라.

변경 전 git diff --check와 npm run build를 실행하고,
변경 뒤 배포 성공과 핵심 화면 스모크 확인을 마쳐야 한다.
```

## 14. 이식 범위와 한계

이 패키지는 코드, 문서, 생성기, CI/CD 설정, Supabase 마이그레이션, Edge Function 코드, Git 이력 요약, 파일 체크섬을 이식한다. 원본 채팅 전체, 브라우저 세션, 다운로드 폴더, 비밀값, 실제 사용자 데이터는 안전과 권한상 자동 이식하지 않는다.

원본 대화가 꼭 필요하면 사용자가 해당 서비스에서 직접 내보내 보관하고, 이 문서의 결정 요약을 기준으로 연결한다. **모든 데이터**를 옮긴다는 말은 개인 비밀과 실제 응답을 복사한다는 뜻이 아니라, 서비스가 계속될 수 있는 코드·결정·절차·무결성 정보를 완전하게 옮긴다는 뜻으로 해석한다.

---

**정확한 다음 행동:** 이 문서를 읽고, `docs/transfer/RESTORE_AND_CONTINUE.md`로 복구 절차를 확인한 뒤, 목적에 맞는 `docs/operations-manuals/INDEX.csv`의 매뉴얼 하나만 열어 실행한다.
