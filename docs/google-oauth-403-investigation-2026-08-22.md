# Google OAuth 403 access_denied 조사 메모

- 조사일: 2026-08-22
- Supabase 프로젝트: `bnbdxcyarerrmijuvxdb` (Cokform, ap-northeast-2)
- 오류 OAuth 클라이언트 ID: `843883433439-k5jg77qapl6vvr44gnbj257qa40damfo.apps.googleusercontent.com`
- 콜백 URI: `https://bnbdxcyarerrmijuvxdb.supabase.co/auth/v1/callback`

## 관찰 사항

오류 요청에는 기본 Google 로그인 권한(`openid`, `userinfo.email`, `userinfo.profile`)과 Google Drive 파일 단위 권한(`https://www.googleapis.com/auth/drive.file`)이 함께 들어 있다. 콕폼 코드상 `drive.file`은 일반 로그인에서 요청하지 않고, 응답 내보내기 메뉴의 `Google Drive 연결`을 선택했을 때만 별도로 요청한다.

따라서 오류는 일반 로그인 흐름보다 Google Drive 연결 권한 요청에서 발생했을 가능성이 높다. 이 범위는 파일 단위 최소 권한이며 Drive 전체 열람 권한이 아니다.

## 현재 결론

Google Cloud Console에서 위 클라이언트 ID가 만들어진 **기존 프로젝트**의 OAuth 동의 화면 설정을 확인해야 한다. External 앱이 Testing 상태라면 사용할 계정을 테스트 사용자에 포함해야 하며, Internal 앱이라면 해당 Google Workspace 조직 계정만 접근할 수 있다. 새 Google Cloud 프로젝트를 사용할 수도 있으나, 새 OAuth 클라이언트를 만든 뒤 Supabase Authentication > Providers > Google의 Client ID와 Client Secret을 새 값으로 교체해야 한다.

## 다음 확인 항목

1. 기존 Google Cloud 프로젝트의 OAuth 동의 화면에서 Audience(Internal/External), Publishing status, Test users를 확인한다.
2. Google Drive API가 기존 프로젝트에서 활성화되어 있는지 확인한다.
3. 기존 프로젝트가 불명확하거나 접근할 수 없을 때만 새 `cokform` 프로젝트에서 OAuth 클라이언트를 새로 발급하고 Supabase에 교체 등록한다.

## 참고

- [Google OAuth 동의 화면 구성](https://developers.google.com/workspace/guides/configure-oauth-consent)
- [Google Drive API 권한 범위](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
