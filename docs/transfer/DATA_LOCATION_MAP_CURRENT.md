# 콕폼 데이터 위치·이식 경계 지도 — 현재 기준

이 문서는 “무엇이 어디에 있고, 새 환경으로 어떻게 옮기며, 무엇을 절대 복사하면 안 되는가”를 정리한다. 실제 비밀값·응답·개인키는 이 문서에 포함하지 않는다.

| 데이터 종류 | 주 위치 | 이식 방법 | 패키지 포함 | 절대 하지 말 것 |
|---|---|---|---:|---|
| 앱 소스 | GitHub 저장소, `src/` | 저장소 복제 | 예 | `node_modules`를 원본처럼 취급 |
| 공개 자산·SEO | `public/`, `index.html` | 저장소 복제 | 예 | 외부 서비스 키를 public에 삽입 |
| 배포 정의 | `.github/workflows/` | 저장소 복제 + GitHub Secrets 재연결 | 예(코드만) | 토큰을 workflow·로그에 기록 |
| DB 스키마·RLS | `supabase/migrations/` | 저장소 복제 + Supabase 확인 | 예 | 운영 DB를 추측으로 직접 수정 |
| Edge Function 코드 | `supabase/functions/` | 저장소 복제 + Secrets 재등록 | 예(코드만) | Secret을 함수 코드에 하드코딩 |
| 공개 폼 구조 | Supabase + 작성자 브라우저 캐시 | Supabase 백업·복구 절차 | 코드 패키지에는 미포함 | 실제 고객 폼을 문서에 복사 |
| 암호화된 응답 | Supabase DB | 암호문 DB 백업 | 이식 ZIP에는 미포함 | 암호문을 평문처럼 열람·공유 |
| 개인키 금고 | 작성자 브라우저 `localStorage` | 사용자가 암호화 키 백업을 직접 가져오기 | 아니오 | 개인키·백업을 지원 채널에 전송 |
| 같은 탭 키 복원 | 브라우저 `sessionStorage` + IndexedDB의 비추출형 CryptoKey | 브라우저 세션 내만 유지 | 아니오 | 영구 복구 수단으로 오해 |
| 편집 중 폼 초안 | 브라우저 `sessionStorage` | 같은 탭 새로고침에서 자동 복구 | 아니오 | 응답 원문·키를 초안에 저장 |
| Google OAuth Client Secret | Google Cloud + Supabase Auth 설정 | 새 환경에서 대시보드로 재등록 | 아니오 | Git, 문서, 채팅에 붙여넣기 |
| Cloudflare API 토큰 | GitHub Secrets 또는 Cloudflare | 대시보드로 재연결 | 아니오 | Pages 코드·문서에 기록 |
| Supabase 서비스 역할 키 | Supabase Edge Function Secrets | 서비스 대시보드에서 재등록 | 아니오 | 프런트 환경 변수에 사용 |
| Git 이력 | GitHub 원격 및 `.git` | `git clone` | ZIP에는 요약만 | 자격증명 포함 remote URL 공유 |
| 운영 문서·매뉴얼 | `docs/` | 저장소 복제 또는 이식 ZIP | 예 | 실제 사용자 데이터와 섞기 |
| 원본 채팅 전체 | 각 채팅 서비스 계정 | 사용자가 직접 내보내 별도 비공개 보관 | 아니오 | 원문을 공개 저장소·서비스 로그에 넣기 |

## 새 환경 복구의 권장 순서

1. GitHub 저장소를 복제한다.
2. `docs/MASTER_CONTEXT_COKFORM_CURRENT.md`와 `docs/transfer/RESTORE_AND_CONTINUE.md`를 읽는다.
3. `npm ci`, `npm run build`, `python3 scripts/verify_transfer_inventory.py`를 실행한다.
4. Cloudflare Pages, Supabase, Google OAuth, GitHub Actions를 각 대시보드에서 다시 연결한다.
5. 더미 데이터로 로그인·폼 편집·미리보기·공개 응답 경로를 검수한다.
6. 작성자만 자신의 브라우저에서 암호화 키 백업을 가져와 복구 여부를 검증한다.

> 서비스의 코드·절차·결정·체크섬은 이식할 수 있다. 개인 비밀, 실제 응답, 개인키는 사용자 통제권을 지키기 위해 자동 이식 대상이 아니다.
