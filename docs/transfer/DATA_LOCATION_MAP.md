# Cokform 데이터 위치·이전 지도

이 문서는 ‘파일을 옮겼다’와 ‘서비스 데이터를 완전히 이전했다’를 혼동하지 않게 한다. 이식 ZIP에는 코드와 문서는 담겨 있지만, 보안상 또는 서비스 연결상 별도 이전이 필요한 데이터가 있다.

| 데이터 종류 | 현재 위치 | ZIP 포함 여부 | 이전 방법 | 절대 하면 안 되는 것 |
|---|---|---|---|---|
| React 코드·정적 자산·Supabase 마이그레이션 | 프로젝트 작업 폴더/GitHub | 포함 | ZIP을 풀거나 GitHub 저장소에 푸시 | `node_modules`까지 복사해 환경을 오염 |
| 운영 DB 스키마 | Supabase PostgreSQL | 마이그레이션 포함, 실제 DB는 미포함 | Supabase 프로젝트 유지 또는 승인된 암호화 DB 백업으로 이전 | 서비스 역할 키를 문서·채팅에 저장 |
| 폼 공개 설정 | Supabase `form_public` 등 | 스키마만 포함 | 기존 Supabase 유지, 또는 승인된 백업·복원 절차 사용 | 공개 설정을 임의로 수정해 응답을 닫거나 키를 교체 |
| 암호화된 응답 봉투 | Supabase `responses` | 미포함 | 기존 DB 유지 또는 기존 암호화 백업 사용 | 응답 원문으로 복호화한 뒤 일반 파일로 이동 |
| 개인키 금고·복구 파일 | 작성자 브라우저 localStorage, 사용자 보관 파일 | 미포함 | 각 작성자가 키 백업/전체 복구 번들을 직접 보관·가져오기 | 키·비밀번호·백업 파일을 운영자에게 보내기 |
| 실제 응답 원문 | 작성자 브라우저에서만 복호화 | 미포함 | 작성자 기기에서 내보내기·복구 | 지원·분석·이식 패키지에 넣기 |
| Google OAuth 설정 | Google Cloud + Supabase Auth | 미포함 | 대시보드에서 redirect URL·Client Secret 연결 | Client Secret을 Git에 커밋 |
| Supabase/Cloudflare/GitHub 비밀값 | 각 서비스 Secrets/환경 설정 | 미포함 | 사용자 계정에서 재연결·재등록 | 토큰을 `.env.example` 또는 문서에 쓰기 |
| Git 이력 | GitHub + 로컬 `.git` | 요약만 포함 | GitHub 원격 인증 복구 뒤 최신 커밋 푸시 | 인증 토큰을 포함한 remote URL 저장 |
| GitHub Actions 배포 설정 | `.github/workflows` | 포함 | Secrets 재연결 후 워크플로 실행 | Actions 로그에 시크릿 출력 |
| Cloudflare Pages 배포물 | Cloudflare Pages | 미포함 | GitHub Actions/Direct Upload로 재배포 | 운영 도메인을 테스트 값으로 덮어쓰기 |
| 원본 대화 | 대화 플랫폼 | 원문 미포함, 결정 요약 포함 | 플랫폼에서 별도 보관/내보내기 | 원문을 공개 저장소에 업로드 |

## 완전 이전의 실제 순서

1. 이 ZIP을 풀고 `scripts/verify_transfer_inventory.py`로 코드·문서 무결성을 확인한다.
2. GitHub 인증을 복구해 로컬 미푸시 커밋을 원격에 반영한다.
3. Supabase 프로젝트 연결과 마이그레이션 상태를 확인한다. 실제 응답 DB를 옮길 계획이라면 기존 암호화 백업 방식과 복구 테스트를 먼저 한다.
4. Cloudflare Pages와 GitHub Actions 시크릿을 대시보드에서 다시 연결한다.
5. Google OAuth redirect URL과 Client Secret을 새 배포 도메인 기준으로 확인한다.
6. 각 폼 작성자는 자신의 키 백업 또는 전체 복구 번들을 직접 보관·복구한다.
7. 실제 고객 응답을 열지 않는 더미 데이터 스모크 테스트로 서비스가 돌아오는지 확인한다.

> **핵심:** 암호화된 응답 DB를 옮겨도 해당 폼 작성자의 개인키를 함께 안전하게 복구하지 못하면 응답 원문은 열 수 없다. 반대로 개인키만 옮기고 서버 암호문이 없으면 응답 원문을 복구할 수 없다. 두 축은 사용자 주도 방식으로 따로 보존해야 한다.
