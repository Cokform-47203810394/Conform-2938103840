# Cokform SEO·GEO 운영 메모

조사일: 2026-08-18 (KST)

Google Search Central의 sitemap 가이드는 sitemap에 절대 URL과 검색 결과에 노출시키려는 canonical URL만 넣고, 사이트 루트에 두는 방식을 권장한다. Google은 `changefreq`와 `priority`를 무시하며, `lastmod`는 일관되고 검증 가능한 경우에만 사용한다. sitemap 제출은 크롤링·색인을 보장하지 않는 힌트다. 출처: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

Google의 recrawl 가이드는 개별 소수 URL에는 Search Console URL Inspection의 색인 요청을, 많은 URL에는 sitemap 제출을 안내한다. 색인에는 며칠에서 몇 주가 걸릴 수 있으며 반복 요청이 더 빠른 크롤링을 보장하지 않는다. 출처: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

Cokform은 운영 도메인 `https://cokform.pages.dev/`로 서비스 중인데, 기존 index.html canonical/OG와 robots/sitemap/manifest에는 GitHub Pages 경로가 남아 있었다. 이 불일치는 canonical 신호·사이트맵·PWA 시작 URL을 분산시키므로 Pages 운영 URL로 우선 정정해야 한다.

GEO를 위한 공개 자산은 제품 설명·보안 모델·개인정보 처리 경계·지원 범위·FAQ를 사람과 기계가 읽기 쉬운 정적 문서로 제공하고, `llms.txt`에 핵심 사실과 canonical 문서를 안내하는 방식으로 시작한다. E2EE를 과장하지 않고 키가 작성자 브라우저에 남으며 키 백업 전에는 복구가 제한된다는 사실을 명시한다.
