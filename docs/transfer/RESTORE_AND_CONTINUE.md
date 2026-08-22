# Cokform 이식·복구·계속 작업 절차

이 문서는 `Cokform_handover_YYYY-MM-DD.zip`을 새 컴퓨터, 새 작업 디렉터리, 또는 새 AI 세션에 옮긴 뒤 안전하게 이어서 작업하는 순서다.

> 이 패키지에는 코드와 문서는 들어 있지만, 실제 OAuth 비밀값·GitHub/Cloudflare/Supabase 자격증명·브라우저 세션·개인키·복구 파일·사용자 응답은 들어 있지 않다. 새 환경에서 서비스를 연결할 때는 각 대시보드 또는 사용자 본인이 보관한 비밀값을 사용한다.

## 1. 패키지 풀기와 무결성 확인

```bash
unzip Cokform_transfer_package_2026-08-21.zip -d Cokform-transfer
cd Cokform-transfer/Cokform-Conform-2938103840
python3 scripts/verify_transfer_inventory.py
```

검증 결과가 `Missing: 0`, `Changed: 0`이어야 한다. 다르면 패키지를 다시 받거나, 의도한 수정인지 확인하기 전까지 배포하지 않는다.

## 2. 먼저 읽을 문서

1. `docs/AI_AND_OPERATOR_START_HERE.md`
2. `docs/MASTER_CONTEXT_COKFORM_CURRENT.md`
3. `docs/OPERATIONS_MANUAL_SYSTEM.md`
4. `docs/validation-freeze-and-readiness-2026-08.md`
5. `docs/transfer/SESSION_CONTINUITY_2026-08-22.md`
6. `docs/transfer/GIT_HISTORY.txt`

이 문서들은 제품의 현재 상태, 금지선, 최근 변경, 다음 우선순위, 원격 동기화 상태를 설명한다.

## 3. 개발 환경 복구

```bash
npm ci
npm run build
```

`.env.example`을 보고 필요한 공개 환경 변수의 이름만 확인한다. 실제 값을 저장소·채팅·스크린샷에 넣지 않는다. 서버 비밀값은 Supabase Edge Function Secrets 등 해당 서비스의 보안 설정에서만 관리한다.

## 4. 원격 저장소 복구

로컬 이식본에는 `.git` 전체 기록을 넣지 않았을 수 있다. 새 저장소를 복제한 다음 이식 패키지의 파일을 덮어쓰는 방식이 가장 안전하다.

```bash
gh auth status
gh repo clone Cokform-47203810394/Conform-2938103840 Cokform-Conform-2938103840
# 이식 패키지의 파일을 복제본에 복사한다. node_modules, .git, 실제 .env는 복사하지 않는다.
cd Cokform-Conform-2938103840
git status
git add .
git commit -m "docs: restore transfer package"
git push origin main
```

GitHub 인증이 실패하면 개인 액세스 토큰을 문서에 붙이지 않는다. 사용자가 GitHub 연결을 다시 인증한 뒤 진행한다.

## 5. Supabase·Cloudflare 연결 확인

| 서비스 | 확인할 것 | 비밀값 취급 |
|---|---|---|
| Supabase | 프로젝트 ID, Auth Google redirect URL, RLS, 마이그레이션, Edge Function Secrets | 서비스 역할 키는 프런트 코드·문서·채팅에 넣지 않음 |
| Cloudflare Pages | 프로젝트 연결, 프로덕션 URL, GitHub Actions/Direct Upload 배포 | API 토큰은 GitHub Secret 또는 Cloudflare 보안 설정에만 저장 |
| Google OAuth | 승인된 redirect URL과 배포 도메인 | Client Secret을 코드에 넣지 않음 |
| GitHub Actions | `cloudflare-pages.yml`과 필요한 Secrets | 로그에 시크릿이 보이지 않는지 확인 |

## 6. 서비스 재개 전 최소 스모크 테스트

1. 홈이 열린다.
2. Google 로그인 후 폼을 연다.
3. 질문을 추가하고 저장한다.
4. 미리보기가 열린다.
5. 공개 링크가 로그인 없이 열린다.
6. 더미 답변 제출 오류가 사용자 문구로 표시된다.
7. 개인키가 없는 브라우저에서 응답 원문이 열리지 않는다.
8. `npm run build`와 Cloudflare 배포가 성공한다.

실제 고객 답변, 개인키, 복구 비밀번호를 사용해 테스트하지 않는다.

## 7. 현재 작업 규율

새 기능을 추가하지 않는다. 먼저 테스트 러너, 키 복구 테스트, 개인정보 없는 분석 이벤트, 컨시어지 파일럿 3회, 사용자 재사용 증거를 만든다. 세부 기준은 `docs/validation-freeze-and-readiness-2026-08.md`를 따른다.

## 8. 다른 AI에 넘길 때

아래 프롬프트와 마스터 컨텍스트 파일을 함께 제공한다.

```text
Cokform 프로젝트를 이어서 작업한다.
먼저 docs/AI_AND_OPERATOR_START_HERE.md,
docs/MASTER_CONTEXT_COKFORM_CURRENT.md,
docs/OPERATIONS_MANUAL_SYSTEM.md,
docs/validation-freeze-and-readiness-2026-08.md,
docs/transfer/SESSION_CONTINUITY_2026-08-22.md를 읽어라.

개인키·복구 비밀번호·키 백업·응답 원문·토큰을 요청하거나 기록하지 마라.
현재는 기능 동결 상태다. 테스트·복구·측정·컨시어지 검증 외의 새 기능을 추가하지 마라.
작업 전 파일 무결성을 verify_transfer_inventory.py로 확인하고,
작업 뒤 npm run build와 운영 스모크 확인을 수행하라.
```
