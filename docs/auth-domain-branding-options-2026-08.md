# Cokform Google 로그인 도메인 브랜딩 검토

**작성일:** 2026-08-18  
**대상:** `cokform.pages.dev`와 Supabase Auth 프로젝트 `bnbdxcyarerrmijuvxdb`

## 현재 원인

현재 로그인은 `supabase.auth.signInWithOAuth({ provider: "google" })` 흐름을 사용한다. Google은 인증을 마친 뒤 Supabase Auth의 `/auth/v1/callback`으로 이동하므로 브라우저가 `bnbdxcyarerrmijuvxdb.supabase.co으로 이동`을 표시한다. 애플리케이션의 최종 복귀 URL을 `https://cokform.pages.dev/`로 설정해도, 중간 OAuth 콜백 호스트 표시는 바뀌지 않는다.

## 선택지

| 방식 | 사용자에게 보이는 흐름 | 비용·전제 | 필요한 변경 | 위험과 한계 |
|---|---|---|---|---|
| Supabase Auth 커스텀 도메인 | `auth.cokform.<도메인>` 같은 자체 Auth 호스트가 OAuth 콜백으로 표시 | Supabase 유료 플랜의 유료 애드온, 소유한 루트 도메인 필요 | DNS CNAME·TXT 검증, Supabase 도메인 활성화, Google OAuth redirect URI 추가, 프론트 Supabase URL 교체 | 가장 정석적이나 현재 월 1만원 이하 파일럿 예산과 충돌할 수 있음 |
| Google Identity Services ID 토큰 로그인 | Google의 브랜드 로그인 팝업에서 Cokform 앱·`cokform.pages.dev` origin을 기반으로 진행하고 Supabase 도메인으로 페이지 이동하지 않음 | 추가 인프라 비용 없음, 기존 Google Web Client ID 재사용 가능 | Google Cloud에 `https://cokform.pages.dev` JavaScript origin 추가, 공개 Client ID를 프론트 빌드 변수로 주입, nonce 기반 `signInWithIdToken` 구현 | Drive처럼 Google API 접근 권한이 필요한 기능은 기존 OAuth 리디렉션을 계속 별도 사용해야 함 |

## 확정 사실

Supabase 공식 문서는 커스텀 도메인이 OAuth consent/callback에 프로젝트 ID 대신 브랜드 도메인을 표시한다고 명시한다. 동시에 커스텀 도메인은 유료 플랜의 유료 애드온이며 CNAME을 지원하는 서브도메인만 사용할 수 있다. 활성화 전 Google OAuth 개발자 콘솔에 기존 callback과 새 callback을 함께 등록해야 한다.

Supabase 공식 Google 로그인 문서는 Google Identity Services의 popup/One Tap이 반환한 ID token을 `supabase.auth.signInWithIdToken({ provider: "google", token, nonce })`으로 교환하는 방식을 지원한다. nonce는 매 로그인 시 새로 만들고, Google에는 SHA-256 해시 값을, Supabase에는 원문 값을 전달해야 한다. Google 공식 문서는 이 방식에 Web Client ID와 `https://cokform.pages.dev` JavaScript origin 등록이 필요하다고 설명한다.

## 참고 자료

1. Supabase, [Custom Domains](https://supabase.com/docs/guides/platform/custom-domains)
2. Supabase, [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
3. Google for Developers, [Get your Google API client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)

## 카카오 로그인 추가 검토

Supabase는 Kakao provider를 공식 지원한다. 표준 연동은 카카오의 REST API Key와 Kakao Login Client Secret을 Supabase Provider 설정에 넣고, 카카오 개발자 콘솔에 `https://<project-ref>.supabase.co/auth/v1/callback`을 리다이렉트 URI로 등록하는 방식이다. 따라서 현재처럼 Supabase OAuth 리디렉션을 사용하는 경우 Google과 마찬가지로 `bnbdxcyarerrmijuvxdb.supabase.co` 중간 콜백이 나타난다. 카카오 로그인만 추가해도 이 표시 문제는 해결되지 않는다.

카카오 로그인은 한국 사용자에게 친숙한 추가 선택지로 적합하다. 그러나 현재 파일럿에서 계정 식별 목적만 필요하다면 카카오계정 이메일은 선택 항목으로 두거나 요청하지 않는 편이 최소 수집 원칙에 맞다. 카카오 앱의 REST API Key는 Client ID로, Kakao Login Client Secret은 Supabase에만 보관해야 한다. 카카오 로그인 활성화와 redirect URI 등록은 필수이며, 이메일을 받으려면 Biz App 권한이 필요하다.

| 항목 | 표준 Supabase Kakao OAuth | Kakao JS/OIDC ID Token 경로 |
|---|---|---|
| Supabase 중간 도메인 노출 | 노출됨 | 서버에서 authorization code를 ID token으로 교환해야 하므로 정적 Pages만으로는 안전하게 완결 불가 |
| 구축 난이도 | 낮음 | 높음, client secret을 보호할 서버 측 처리 필요 |
| 현재 Cokform 권장 용도 | 카카오 로그인 선택지 추가 | 현 단계에서는 보류 |

## 업데이트된 결론

사용자에게 `bnbdxcyarerrmijuvxdb.supabase.co`을 보이지 않게 하는 목적에는 Google Identity Services ID token 로그인(일반 로그인용) 또는 Supabase 유료 커스텀 Auth 도메인만 직접적인 해법이다. 카카오 로그인은 한국 시장의 로그인 선택지를 넓히는 기능으로 별도 도입 가치가 있지만, 현재 기본 Supabase OAuth 방식으로 붙이면 같은 Auth 도메인 문제를 반복한다. 따라서 무료 파일럿에서는 **Google 브랜드 팝업 로그인으로 기본 로그인 UX를 먼저 교체**하고, 카카오 로그인은 앱 아이콘·개인정보처리방침·동의항목이 준비된 뒤 선택 제공하는 순서가 적절하다.

## 추가 참고 자료

4. Kakao Developers, [카카오 로그인 설정하기](https://developers.kakao.com/docs/ko/kakaologin/prerequisite)
5. Kakao Developers, [앱 설정](https://developers.kakao.com/docs/ko/app-setting/app)
6. Supabase, [Login with Kakao](https://supabase.com/docs/guides/auth/social-login/auth-kakao)
