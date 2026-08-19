# Cokform 공개 문서 경로·고지 점검 — 2026-08-19

## 경로 확인

`/security`, `/faq`는 React SPA 라우트가 아니라 `public/security.html`, `public/faq.html`에서 제공되는 정적 공개 페이지다. 운영 배포에서 두 경로 모두 HTTP 200과 실제 콘텐츠를 확인했다. 따라서 `App.jsx`에 라우트가 없다는 이유만으로 해당 문서가 404라고 판정하면 안 된다.

| 경로 | 제공 방식 | 운영 확인 |
|---|---|---|
| `/security` | `public/security.html` | HTTP 200, 응답 암호화 안내 확인 |
| `/faq` | `public/faq.html` | HTTP 200, FAQ 구조화 데이터와 본문 확인 |
| `/privacy` | React 공개 문서 페이지 | HTTP 200, 보관·파기 문구 확인 |
| `/terms` | React 공개 문서 페이지 | HTTP 200, 정책 링크·변경 고지 문구 확인 |
| `/international-transfer` | React 공개 문서 페이지 | HTTP 200 |
| `/service-restrictions` | React 공개 문서 페이지 | HTTP 200 |
| `/docs` | React 공개 문서 페이지 | HTTP 200 |
| `/resources` | React 공개 문서 페이지 | HTTP 200 |

## 이번 보강

개인정보처리방침에는 기본 보관기간 180일, 설정 가능 범위 1~3,650일, 매일 실행되는 만료 응답 자동 파기, 파기 기록의 범위, 작성자가 내보낸 파일의 별도 관리 책임을 추가했다. 운영 데이터베이스에서 `cokform-purge-expired-responses` 예약 작업이 매일 실행되도록 활성화된 상태를 확인했다.

이용약관에는 개인정보처리방침·서비스 이용제한 정책·개인정보 국외이전 안내로 가는 실제 내부 링크, 약관 변경의 적용일·변경 내용·변경 사유 고지, 일반 변경 7일 전 및 중요한/불리한 변경 30일 전 고지 원칙, 사업자등록 전 파일럿 운영 상태의 투명한 안내를 추가했다.

## 아직 사용자가 확정해야 하는 정보

사업자 등록 후 상호, 대표자명, 사업자등록번호, 사업장 주소, 개인정보 보호책임자 성명 및 연락처, Cloudflare·Google·Supabase의 실제 계약·처리 리전·보유 조건은 확인된 정보로만 바꿔야 한다. 추정값이나 임시 정보를 확정 고지로 넣지 않는다.

## 참고한 공식 자료

- 개인정보보호위원회, 2026 개인정보 처리방침 작성지침: https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20885
- 국가법령정보센터, 전자상거래 등에서의 소비자보호 지침: https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000243022&chrClsCd=010201

## 사업자 안내 추가 검증 — 2026-08-19

`/business-info`를 React 공개 페이지로 추가하고 운영 배포에서 정상 렌더링을 확인했다. 페이지에는 사업자등록 전 비공개 파일럿 상태, 서비스명, 임시 문의처, 아직 확정되지 않은 상호·대표자명·사업자등록번호·주소·개인정보 보호책임자 정보를 사실대로 구분해 표시한다.

정적 `/sitemap` 페이지와 XML `/sitemap.xml`, 홈 푸터, 개인정보처리방침, 이용약관 모두 `/business-info`로 연결되도록 반영했다. 운영 사이트맵에서 사업자 안내 링크가 실제로 표시되는 것도 확인했다.
