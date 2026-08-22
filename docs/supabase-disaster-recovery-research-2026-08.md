# Cokform Supabase 장애·종료 대비 조사

**작성일:** 2026-08-18  
**대상:** Cokform Supabase 프로젝트 `bnbdxcyarerrmijuvxdb`

## 현재 결론

Cokform의 응답 평문은 서버가 아닌 브라우저에서 복호화해야 한다. 따라서 Supabase 사고·종료 대비는 두 갈래로 분리한다.

1. **운영 데이터 복구:** forms, public forms, 암호문 responses, 암호화 버전, 보유기간·감사·참여 메타데이터와 스키마를 외부 저장소에 정기적으로 논리 백업한다.
2. **작성자 복호화 능력 복구:** 개인키 자체는 Supabase에 올리지 않고, 작성자 복구 비밀번호로 암호화한 키 백업 파일을 별도 보관한다.

둘 중 하나라도 없으면 완전 복구는 불가능하다. 운영 데이터 백업은 암호문을 되살리고, 작성자 키 백업은 그 암호문을 읽게 한다.

## Supabase 공식 백업 경로

| 항목 | 공식 지원 범위 | Cokform 파일럿 판단 |
|---|---|---|
| Free 계획 | 일일 자동 백업 보장 대신 CLI `db dump`와 오프사이트 백업을 권장 | GitHub에 원문 DB dump를 저장하지 않고, 별도 비공개·암호화 저장소를 사용해야 함 |
| Pro 일일 백업 | 최근 7일 일일 백업 | 비용 목표를 넘을 수 있어 초기 기본안으로 채택하지 않음 |
| PITR | Pro 이상 + Small compute 필요, 7일 기준 월 약 100달러부터 | 파일럿 예산과 맞지 않아 미채택 |
| 논리 백업 | roles·schema·data를 분리 덤프하고 새 프로젝트에 `psql`로 복원 | 프로젝트 삭제·이관 시 필요한 표준 운영 절차 |
| Storage | DB 백업에는 Storage 객체가 포함되지 않음 | Cokform은 현재 설명 이미지의 data URL 저장 방식이라 향후 Storage 도입 시 별도 객체 백업이 필요 |

## 복구 절차 초안

1. 백업 시점의 roles, public schema, auth data, public data SQL과 앱 소스·GitHub Secrets 구성 목록을 확보한다.
2. 새 Supabase 프로젝트를 만들고 roles → public schema → auth data → public data 순으로 단일 트랜잭션 복원한다. Auth 데이터는 기존 작성자 UUID와 폼 소유권 연결을 보존하기 위해 public data보다 먼저 복원한다.
3. Google OAuth redirect URL·Supabase URL/publishable key·Cloudflare 빌드 secrets를 새 프로젝트 값으로 교체한다. 새 프로젝트의 JWT secret이 달라지면 기존 로그인 세션은 다시 로그인해야 한다.
4. 작성자는 `.cokform-key.json` 암호화 키 백업을 가져오고 본인 복구 비밀번호로 금고를 연다.
5. 암호문 응답, v2 AAD(form ID·purpose) 검증, RLS·자동 파기·감사 로그를 점검한 뒤 재개한다.

## 구현된 자동 암호화 백업

`.github/workflows/supabase-encrypted-backup.yml`은 매일 04:29 KST에 roles, public schema, Auth 사용자 데이터, public data 논리 덤프를 생성한 뒤 하나의 압축 파일로 묶어 `age` 공개키 암호화한다. Supabase CLI 기본 덤프는 Auth를 제외하므로 Auth 데이터는 명시적으로 추가한다. GitHub Actions에는 암호문과 SHA-256 검증값만 90일 보관한다. 평문 SQL은 백업 실행 중의 임시 러너 디렉터리에만 존재하고, 작업 종료 시 삭제된다.

운영자가 한 번만 설정해야 하는 값은 다음 두 개다. `SUPABASE_DB_URL`은 GitHub Actions **Secret**으로, Supabase Connect 화면의 Session Pooler 연결 문자열을 사용한다. `BACKUP_AGE_RECIPIENT`는 GitHub Actions **Variable**로, 운영자가 오프라인에서 보관하는 `age` 개인키의 공개 수신자 문자열(`age1…`)만 넣는다. 개인키는 GitHub·Supabase·Cloudflare·Cokform 어느 곳에도 넣지 않는다.

| 구성 값 | 저장 위치 | 포함하면 안 되는 것 |
|---|---|---|
| `SUPABASE_DB_URL` | GitHub Actions Secret | 코드·문서·클라이언트 번들 |
| `BACKUP_AGE_RECIPIENT` | GitHub Actions Variable | 개인키·복구 비밀번호 |
| age 개인키 | 운영자 오프라인 보관소 | GitHub, Supabase, Cloudflare, 이메일 본문 |

운영자는 신뢰할 수 있는 자신의 기기에서 `age-keygen -o cokform-backup-key.txt`를 한 번 실행해 개인키를 만들고, 출력된 `age1…` 공개키만 `BACKUP_AGE_RECIPIENT`에 등록한다. `cokform-backup-key.txt`는 비밀번호 관리자의 암호화 첨부파일과 오프라인 저장장치처럼 서로 다른 두 곳에 보관한다.

복구 시에는 Actions artifact에서 `.tar.gz.age`와 `.sha256`을 함께 받은 뒤 `sha256sum -c <파일명>.sha256`, `age --decrypt --identity cokform-backup-key.txt --output backup.tar.gz backup.tar.gz.age`, `tar -xzf backup.tar.gz` 순서로 검증·복호화한다. 새 Supabase 프로젝트에 roles → public schema → auth data → public data 순으로 단일 트랜잭션 복원을 수행한다. 작성자는 이어서 같은 폼의 `.cokform-recovery.json`과 복구 비밀번호를 가져와 개인키 금고를 열어야 응답을 읽을 수 있다.

## 공식 근거

1. Supabase, [Database Backups](https://supabase.com/docs/guides/platform/backups)
2. Supabase, [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
3. Supabase, [Automated backups using GitHub Actions](https://supabase.com/docs/guides/deployment/ci/backups)
