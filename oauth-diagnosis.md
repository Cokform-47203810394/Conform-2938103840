# Cokform Google OAuth 진단

- Supabase Auth URL Configuration의 기존 Site URL은 `http://localhost:3000`이었다.
- Redirect URLs는 비어 있었고, 운영 `https://cokform.pages.dev/`와 로컬 `http://localhost:3000/`를 추가 저장했다.
- Site URL도 `https://cokform.pages.dev/`로 저장했다.
- 운영 callback으로 이동한 뒤에도 `Unable to exchange external code` 오류가 남았으므로 callback 경로 문제와 provider code 교환 문제를 분리했다.
- Supabase Google provider는 enabled 상태이며 Client ID는 Google Cloud의 `design pick` Web OAuth client와 일치한다.
- Google Cloud OAuth client의 Authorized JavaScript origin은 `https://cokform.pages.dev`로 확인됐다.
- Google Cloud client 상세는 client secret을 원문으로 보여주지 않고 마지막 일부만 표시하며, 새 secret을 추가할 수 있다.
- 다음 조치는 Google Cloud에서 같은 OAuth client의 새 client secret을 생성하고 Supabase Google provider의 Client Secret을 그 새 값으로 교체하는 것이다. Supabase provider와 Google Cloud는 반드시 같은 Client ID/Secret 쌍을 사용해야 한다.
