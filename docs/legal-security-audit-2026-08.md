# Cokform 법률·보안 감사

> **작업용 감사 기록 — 정식 법률 자문이나 침해 테스트 보고서가 아닙니다.** 이 문서는 Cokform 소유자의 승인에 따라 공개 페이지, 저장소 코드, 계정 설정을 비파괴 방식으로 점검한 결과를 기록합니다. 실제 대표자·사업자·위탁계약·보안 인증 현황은 확인된 사실만 반영해야 하며, 정식 서비스 공개 전에는 한국 변호사와 보안 전문가의 검토가 필요합니다.

## 점검 범위와 경계

점검 대상은 `cokform.pages.dev`, Cokform 공개 정적 자산, React 코드, Supabase 프로젝트의 읽기 전용 보안 점검, Cloudflare 계정의 읽기 전용 설정 확인입니다. 서비스 중단, 무차별 대입, 타인 계정 접근, 응답 평문·키 추출, 데이터 생성·변조·삭제, 권한 우회는 범위에서 제외합니다.

## 공식 기준

개인정보보호위원회는 개인정보 처리방침을 적정하고 투명하게 작성·공개하기 위한 지침을 제공하며, 개인정보 보호법 시행령 제31조는 처리 항목, 국외이전의 근거·세부 사항, 안전성 확보조치 및 해외 직접 수집 국가를 처리방침에 포함하도록 규정합니다. 시행령은 처리방침을 인터넷 홈페이지에 지속적으로 게재하도록 정합니다.[^pipa-guideline] [^pipa-decree]

개인정보보호위원회의 국외이전 안내는 국외 제공·처리위탁·보관 또는 해외 조회가 국외이전에 해당할 수 있으며, 별도 동의·계약 이행을 위한 위탁·보관·인증·동등성 인정 등 법적 근거와 보호조치를 요구한다고 설명합니다.[^pipc-crossborder]

Cloudflare 공식 문서는 Data Localization Suite를 별도로 설정해야 HTTPS 복호화·처리 위치와 트래픽 메타데이터·로그 보관 위치를 제어할 수 있다고 안내합니다. 별도 경계가 없으면 고객 로그는 글로벌 코어 데이터센터에서 처리·보관될 수 있습니다.[^cloudflare-dls] [^cloudflare-cmb]

## 초기 법률 고지 점검 결과

| 우선순위 | 확인 사항 | 판단 | 필요한 조치 |
| --- | --- | --- | --- |
| P0 | 개인정보처리방침의 개인정보 보호책임자, 사업자·대표자·주소, 실제 수탁자별 보관기간·연락처가 미확정 | 실제 사실을 공개하지 못한 상태여서 정식 대외 서비스 고지로는 불완전함 | 실제 정보 확인 뒤 방침·약관·국외이전 표에 일괄 반영 |
| P0 | 국외이전 표의 Cloudflare 처리자·국가·보유기간·연락처·법적 근거가 포괄적 표현에 머묾 | 시행령 제31조의 구체 공개 취지에 부족할 위험 | 실제 계약·기능·지역을 확인해 표를 확정하고, 확인 전에는 단정적 표현 금지 |
| P1 | 개인정보처리방침이 항목별 처리 목적, 플랫폼 메타데이터의 보유기간, 파기 방법, 수탁자 목록, 권리 행사 절차·담당자 정보를 완결적으로 구분하지 않음 | 이용자가 자기 정보 처리 방식을 예측하기 어려움 | ‘처리 목적·항목·보유기간’, ‘처리위탁’, ‘파기’, ‘안전성 조치’, ‘권리 행사’, ‘보호책임자’ 단락으로 분리 |
| P1 | 이용약관에 약관 변경 사전 고지, 이용 종료·계정 탈퇴·데이터 처리, 사업자 표시, 서비스 요금·유료 전환 기준이 구체적이지 않음 | 소비자·계약 분쟁 시 해석 리스크 | 실제 운영 모델 확정 후 별도 조항 보완 |
| P1 | 개인정보 동의 템플릿의 기본 목적·항목·보관기간이 범용 예시이며, 폼 질문과 자동 대조되지 않음 | 폼 운영자가 실제와 다른 동의를 받을 위험 | 템플릿에 경고·검증을 추가하고 운영자 입력 책임을 명확히 고지 |

## 초기 인프라 사실

Cloudflare Regional Services 바인딩 읽기 요청은 `1101: forbidden: account not entitled for regional services for BYOIP`를 반환했습니다. 이 결과만으로 모든 Cloudflare 데이터 현지화 설정 부재를 단정할 수는 없지만, Cokform은 현 시점에 데이터 현지화가 적용됐다고 공개해서는 안 되며 Cloudflare의 글로벌 처리 가능성을 기준으로 국외 처리 고지를 보수적으로 유지해야 합니다.

[^pipa-guideline]: [개인정보 포털 — 2026 개인정보 처리방침 작성지침](https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20885)
[^pipa-decree]: [국가법령정보센터 — 개인정보 보호법 시행령 제31조](https://www.law.go.kr/LSW//lsLinkCommonInfo.do?lspttninfSeq=67000&chrClsCd=010202)
[^pipc-crossborder]: [개인정보보호위원회 — 국외이전 제도](https://www.pipc.go.kr/np/default/page.do?mCode=D060040010)
[^cloudflare-dls]: [Cloudflare Docs — Data Localization Suite](https://developers.cloudflare.com/data-localization/)
[^cloudflare-cmb]: [Cloudflare Docs — Customer Metadata Boundary](https://developers.cloudflare.com/data-localization/metadata-boundary/)

Supabase 관리 API의 읽기 전용 프로젝트 조회 결과, Cokform 프로젝트 `bnbdxcyarerrmijuvxdb`는 `ap-northeast-2` 리전에 있으며 상태는 `ACTIVE_HEALTHY`입니다. 따라서 Supabase의 주 데이터베이스 리전을 대한민국 서울로 고지한 내용은 이 점검 시점에 확인된 사실과 일치합니다. 이 사실은 Cloudflare 전송·엣지 처리 또는 사용자가 선택하는 Google 내보내기 처리 위치를 국내로 보장한다는 뜻은 아닙니다.

## 웹·인증·응답 데이터 보안 점검 및 수정

| 영역 | 확인 결과 | 조치 및 상태 |
| --- | --- | --- |
| XSS | 서식 텍스트 렌더링 지점은 `sanitizeRichText()`를 거치며, 허용 태그는 `b`, `strong`, `i`, `em`, `u`, `s`, `strike`, `br`로 제한되고 모든 속성이 제거됨 | **통과**. `dangerouslySetInnerHTML`은 이 정화 함수 적용 지점으로 한정됨 |
| 공개 폼 경계 | `form_public`에는 협업자 이메일과 작성자 홈 카드 이미지가 제외되며, 비작성자 공개 응답에는 응답 행을 반환하지 않음 | **통과**. 다만 공개 폼 내용 자체는 공유 URL을 가진 누구나 읽을 수 있으므로 폼 작성자가 공개 본문에 비밀 정보를 넣어서는 안 됨 |
| 로그인 참여자 UX | 기존에는 로그인한 비작성자가 소유자 전용 `forms` 행만 먼저 읽어 공개 폼을 찾지 못할 수 있었음 | **수정 완료**. 소유자 행이 없을 때 정화된 `form_public` 행으로 폴백하도록 변경 |
| 폼·응답 ID | 이전 코드에 `Math.random()` 대체 경로가 있었음 | **수정 완료**. Web Crypto `randomUUID()` 또는 `getRandomValues()`로 만든 UUID v4만 사용하며, 안전한 난수 API가 없는 환경에서는 중단 |
| 직접 응답 삽입 | 익명 PostgREST 삽입 정책은 응답 기간만 검증했으므로 자동화된 대량 암호문·스팸 제출이 가능했음 | **수정 완료**. 운영 DB에서 `responses public insert` 정책을 제거했고, 작성자의 암호화 복구 데이터만 별도 소유자 정책으로 허용 |
| 제출 게이트웨이 | `submit-e2ee-response` Supabase Edge Function v2가 활성 상태이며, 형식·크기·출처·응답기간·E2EE 봉투·Turnstile을 확인한 뒤에만 서비스 역할로 암호문을 삽입함 | **수정 완료**. Edge Function은 개인키·평문 답변을 받거나 기록하지 않음 |
| 봇 방어 | Cloudflare Turnstile 관리형 위젯을 `cokform.pages.dev` 전용으로 생성했고, 서버 비밀값은 저장소가 아닌 Supabase Vault에 보관 | **수정 완료**. 공개 사이트 키는 UI에만 포함되며 Vault 비밀값은 `service_role` 전용 함수로만 읽음 |
| 속도 제한 | 원시 IP, 이메일, 답변, 장기 브라우저 ID를 저장하지 않는 조건으로 보호가 필요했음 | **수정 완료**. 서비스 역할 키로 HMAC 처리한 단기 지문을 사용해 폼별 10분당 12회로 제한하고, 2시간 후 자동 파기 |
| 조회 통계 | 클라이언트가 사용하던 `form_views` 테이블이 운영 DB에는 없었음 | **수정 완료**. RLS가 켜진 조회 통계 테이블과 공개 삽입·작성자 조회 정책을 배포 |
| 브라우저 보안 헤더 | HSTS가 없었고 `/sitemap.xml`에 와일드카드 헤더와 중복될 수 있는 별도 헤더 규칙이 있었음 | **수정 완료**. `Strict-Transport-Security: max-age=31536000; includeSubDomains`를 추가하고 중복 규칙을 제거. Turnstile에 필요한 `script-src`, `frame-src`, `connect-src` 출처만 추가 |

## 재검증 결과

운영 Supabase의 RLS를 재조회한 결과, `responses`에는 작성자 읽기·삭제와 **작성자 암호화 복구 삽입** 정책만 존재하고 익명 삽입 정책은 존재하지 않았습니다. 속도 제한 테이블은 RLS가 켜져 있으면서 브라우저 정책이 전혀 없으므로 Edge Function 서비스 역할만 접근합니다. `form_views`도 RLS가 켜진 상태에서 공개 삽입·작성자 조회만 허용합니다.

공개 제출 함수의 비파괴 음성 테스트에서는 정규 출처 헤더와 공개 API 키를 포함한 잘못된 요청이 **HTTP 400**으로 거부됐고, 출처 헤더를 제거한 같은 요청은 **HTTP 403**으로 거부됐습니다. 이 테스트는 실제 폼, 응답, 응답자 정보, 복호화 키를 생성·열람·변경하지 않았습니다. GitHub Actions의 Cloudflare Pages 배포는 커밋 `bfcadce`와 Turnstile 구성 보완 커밋 `9b82d6f` 모두 성공으로 확인됐습니다.

> Cloudflare Pages 운영 도메인은 점검 환경에서 TLS 연결 시간이 초과되어 마지막 외부 헤더 재수집을 완료하지 못했습니다. Cloudflare Pages API의 최신 배포 상태와 정적 빌드는 성공이지만, 실제 사용자 네트워크에서 HSTS 헤더와 Turnstile 렌더링을 한 번 더 확인해야 합니다.

## 잔여 위험과 출시 전 조치

| 우선순위 | 잔여 위험 또는 미검증 항목 | 출시 전 조치 |
| --- | --- | --- |
| P0 | 개인정보 처리방침·국외이전·약관의 실제 사업자, 보호책임자, 수탁자별 보유기간·연락처·법적 근거가 아직 확정되지 않음 | 임의 기재 금지. 실제 정보가 확정된 뒤 법률 검토를 받아 공개 문구를 갱신 |
| P1 | E2EE는 서버가 답변 평문과 개인키를 읽지 못하게 하지만, 응답자 기기가 악성코드·브라우저 확장 프로그램·피싱에 감염된 상황까지 막지는 못함 | 제품 문서에 위협 모델과 복구 비밀번호·기기 보안 책임을 명확히 설명 |
| P1 | Turnstile·속도 제한은 자동 대량 제출을 크게 낮추지만, 다수 IP·실사용 브라우저·인간 개입 공격을 완전히 제거하지는 못함 | 이상 트래픽 모니터링, 폼별 응답 한도·비밀번호·허용 도메인 기능을 후속 적용 |
| P1 | CSP의 `style-src 'unsafe-inline'`은 동적 테마 색상에 필요해 유지됨 | React 동적 스타일을 CSS 변수·허용 팔레트 클래스로 단계적으로 전환한 뒤 `style-src-attr` 정책 분리를 검토 |
| P1 | `npm audit --omit=dev`는 `pptxgenjs`의 전이 의존성 `image-size@1.2.1`에 DoS 고위험 공지를 표시함 | 브라우저 빌드에는 `image-size` 문자열이 포함되지 않아 즉시 원격 서버 취약점은 확인되지 않았으나, 상위 라이브러리의 수정본 또는 대체 PPTX 생성기로 교체 전까지 공급망 잔여 위험으로 관리 |
| P2 | E2EE 제출의 정상 경로는 실제 공개 폼에서 Turnstile 통과 후 제출까지의 수동 회귀 테스트가 남음 | 실제 테스트 폼에서 작성자·비작성자·로그인 비작성자·모바일 브라우저 시나리오를 각각 검증 |

## 변경 이력

| 커밋 | 변경 |
| --- | --- |
| `bfcadce` | Turnstile 보호 E2EE 제출 게이트웨이, Vault 비밀값 경로, 익명 직접 삽입 폐쇄, 단기 HMAC 속도 제한, HSTS, 로그인 참여자 공개 폼 폴백, Web Crypto UUID 적용 |
| `9b82d6f` | 공개 Turnstile 사이트 키 구성 보완 |

## 추가 참고자료

[^cloudflare-pages-functions]: [Cloudflare Pages — Functions 시작하기](https://developers.cloudflare.com/pages/functions/get-started/)
[^cloudflare-turnstile]: [Cloudflare Turnstile — 서버 측 검증](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
[^supabase-edge-secrets]: [Supabase — Edge Functions 환경 변수와 비밀값](https://supabase.com/docs/guides/functions/secrets)
[^supabase-api-keys]: [Supabase — API 키 이해하기](https://supabase.com/docs/guides/getting-started/api-keys)
