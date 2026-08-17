# Cokform SEO·GEO 운영 메모

조사일: 2026-08-18 (KST)

Google Search Central의 sitemap 가이드는 sitemap에 절대 URL과 검색 결과에 노출시키려는 canonical URL만 넣고, 사이트 루트에 두는 방식을 권장한다. Google은 `changefreq`와 `priority`를 무시하며, `lastmod`는 일관되고 검증 가능한 경우에만 사용한다. sitemap 제출은 크롤링·색인을 보장하지 않는 힌트다. 출처: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

Google의 recrawl 가이드는 개별 소수 URL에는 Search Console URL Inspection의 색인 요청을, 많은 URL에는 sitemap 제출을 안내한다. 색인에는 며칠에서 몇 주가 걸릴 수 있으며 반복 요청이 더 빠른 크롤링을 보장하지 않는다. 출처: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

Cokform은 운영 도메인 `https://cokform.pages.dev/`로 서비스 중인데, 기존 index.html canonical/OG와 robots/sitemap/manifest에는 GitHub Pages 경로가 남아 있었다. 이 불일치는 canonical 신호·사이트맵·PWA 시작 URL을 분산시키므로 Pages 운영 URL로 우선 정정해야 한다.

GEO를 위한 공개 자산은 제품 설명·보안 모델·개인정보 처리 경계·지원 범위·FAQ를 사람과 기계가 읽기 쉬운 정적 문서로 제공하고, `llms.txt`에 핵심 사실과 canonical 문서를 안내하는 방식으로 시작한다. E2EE를 과장하지 않고 키가 작성자 브라우저에 남으며 키 백업 전에는 복구가 제한된다는 사실을 명시한다.

## 운영 배포 검증

2026-08-18 KST에 `https://cokform.pages.dev/security.html`와 `https://cokform.pages.dev/faq.html`의 운영 배포본을 브라우저로 확인했다. Cloudflare Pages는 `.html` URL을 확장자 없는 `/security`, `/faq` canonical 접근으로 제공했고, 두 페이지 모두 1열 카드 기반의 읽기 쉬운 모바일·데스크톱 레이아웃, 명확한 H1, 관련 공개 문서 내부 링크, 응답 암호화·키 관리·개인정보 고지의 제한 설명을 정상 노출했다.

공개 콘텐츠는 검색 노출을 위한 이해 문맥을 제공하지만, 공개 응답 링크나 응답 데이터는 사이트맵에 넣지 않는다. 실제 색인은 Google·Bing·NAVER의 소유권 확인과 제출 후 크롤러 판단에 따르며 순위나 빠른 노출을 보장하지 않는다.

## Google Search Console 등록 상태

2026-08-18 KST에 사용자 Google 계정으로 `https://cokform.pages.dev/` URL 접두어 속성을 새로 추가했다. `pages.dev` DNS는 사용자가 직접 제어할 수 없어서 도메인 속성의 TXT 방식은 사용할 수 없었고, URL 접두어 속성의 HTML 메타 태그 인증으로 전환했다. `index.html`의 `<head>`에 Google이 발급한 verification meta tag를 배포했고, Search Console에서 **소유권이 확인됨** 결과를 확인했다.

Cloudflare Pages는 `.html` 정적 파일을 확장자 없는 URL로 308 리다이렉트하므로, HTML 파일 인증보다 홈페이지 메타 태그 인증을 유지한다. Google 공식 문서도 태그 기반 인증은 URL 접두어에 대한 비로그인 사용자 도착 페이지의 `<head>`에서 확인한다고 설명한다. 출처: https://support.google.com/webmasters/answer/9008080?hl=en

현재 Search Console은 신규 속성 데이터를 처리 중이다. 사이트맵 화면은 로딩 중이며, `https://cokform.pages.dev/sitemap.xml` 제출과 홈페이지·보안·FAQ URL의 색인 요청을 이어서 수행한다.

사이트맵 `https://cokform.pages.dev/sitemap.xml`은 Search Console에 제출 완료로 표시됐다. 신규 제출 직후 표에는 상태가 `가져올 수 없음`, 발견된 페이지 0으로 보였는데, Search Console의 제출 완료 안내는 Google이 이후 주기적으로 처리·변경을 확인한다고 명시한다. 운영 URL은 별도 HTTP 점검에서 200과 `application/xml`을 반환했으므로, 초기 처리 상태는 즉시 실패로 단정하지 않고 다음 크롤링 결과를 다시 확인해야 한다. 다만 사이트맵에는 앞으로 canonical이 명확한 공개 정적 URL만 유지하고, query parameter 기반의 SPA 법적 페이지는 정적 canonical 경로가 마련되기 전까지 재검토한다.

Google Search Console URL Inspection으로 `https://cokform.pages.dev/`를 검사한 결과, **URL이 Google에 등록되어 있음**, **페이지 색인이 생성됨**, **HTTPS 제공** 상태를 확인했다. 따라서 Cokform 브랜드 URL의 홈페이지 자체는 이미 Google 색인에 존재한다. 이번 작업의 효과는 소유권을 현재 사용자 계정에 연결하고, sitemap·canonical·OG·보안/FAQ 공개 문서로 향후 크롤링과 검색 문맥을 정리한 데 있다. URL 검사 화면에는 변경 시 사용할 `색인 생성 요청` 제어가 보였지만, 현재 홈페이지는 이미 색인이 생성된 상태다.

`https://cokform.pages.dev/faq.html`은 Google URL Inspection에서 아직 미등록·미크롤링 상태로 확인됐다. 색인 생성 요청을 실행했으나 Search Console이 **일일 할당량 초과**를 반환해 이 요청은 처리되지 않았다. 내일 다시 요청해야 하며, 이번 세션에서는 같은 계정으로 FAQ·보안 페이지에 대한 재요청을 반복하지 않는다. 홈페이지는 이미 색인되어 있고 sitemap 제출도 완료되어 있으므로, 이 제한은 신규 URL의 즉시 수동 요청에만 영향을 준다.

Bing Webmaster Tools는 `https://www.bing.com/webmasters/`에서 현재 로그인되지 않은 상태로 확인됐다. Bing 사이트 등록에는 Microsoft 계정 로그인이 필요하다. Google Search Console은 홈페이지가 이미 색인됨을 확인했고, FAQ 신규 URL은 미등록 상태였으나 수동 색인 생성 요청은 계정의 일일 할당량 초과로 처리되지 않았다. Bing/NAVER 등록을 위해서는 해당 계정 세션의 로그인 및 이후 소유권 확인 방식이 필요하다.

운영 Cloudflare Pages에서 `https://cokform.pages.dev/sitemap`이 정상 로드되는 것을 확인했다. 운영 홈 푸터에는 브랜드 설명, GitHub, 서비스 링크, 개인정보처리방침·이용약관, XML 사이트맵, 접이식 오픈소스 고지와 저작권·운영 책임 문구가 표시된다. 공개 링크는 `/security`, `/faq`, `/privacy`, `/terms`, `/sitemap`의 확장자 없는 주소를 사용하도록 정비됐다.
