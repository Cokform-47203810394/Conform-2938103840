# 콕폼 백업·선제 점검 감사

**작성일:** 2026-08-22  
**범위:** 폼 구조, E2EE 응답·버전, 작성자 개인키, Supabase 운영 데이터, GitHub Actions 백업, 배포 의존성

## 현재 보호 계층

| 계층 | 보호 대상 | 현재 상태 | 한계 |
|---|---|---|---|
| 편집기 자동저장 | 폼 구조 | 0.4초 지연 저장, 순차 저장 | 컴퓨터·브라우저가 즉시 종료되면 서버 반영 전 변경은 남지 않을 수 있음 |
| 탭 초안 | 저장 전 폼 구조 | 서버 기준선이 일치할 때만 복원 | 같은 탭·브라우저에만 존재하며 응답·개인키는 포함하지 않음 |
| 암호화 버전 기록 | 폼 구조의 이전 상태 | 서버에 암호화 스냅샷 보관, 최근 60개 유지 | 작성자 개인키 없이는 복호화 불가 |
| 대규모 축소 사전 보관 | 다수 문항이 급감하기 전 구조 | 2026-08-22 추가 | 질문 외 설정의 손상까지 일반화해 감지하지는 않음 |
| 폼별 복구 번들 | 폼·암호문 응답·암호화 버전·키 금고 | 작성자가 수동 다운로드 가능 | 브라우저가 파일을 사용자 동의 없이 장기 보관할 수 없음 |
| DB 논리 백업 | public 데이터·스키마·역할 | 매일 age 암호화 후 GitHub artifact 90일 보관 | 기본 Supabase CLI dump는 `auth`, `storage`를 제외함 |
| 소스·마이그레이션 | 앱 코드·스키마 변경 | GitHub Git 이력 | 운영 데이터·개인키는 포함하지 않음 |

## 외부 공식 확인

Supabase는 Free 계획에서 정기적인 CLI `db dump`와 오프사이트 백업을 권장한다. Pro 이상의 일일 백업은 최근 백업만 제공하며, PITR은 훨씬 짧은 복구 시점을 제공하지만 Small compute와 추가 비용이 필요하다. 데이터베이스 백업은 Storage 객체를 포함하지 않는다.[1]

Supabase CLI의 기본 `db dump`는 Supabase 관리 스키마인 `auth`, `storage`, 확장 스키마를 제외한다. 즉, 현재 워크플로의 roles·schema·data 백업은 public 폼 데이터 복구에는 유효하지만, **새 프로젝트에서 기존 로그인 사용자와 Auth 데이터를 그대로 복구하는 완전한 백업은 아니다.** Auth 사용자 이전은 별도의 Auth 스키마 export/import 또는 대시보드 full backup 경로가 필요하다.[2] [3]

## 현재 자동 백업 검증

가장 최근 예약 백업 실행은 성공했고, roles·schema·data 논리 덤프, age 암호화, SHA-256 검증값, 암호화 artifact 업로드가 로그로 확인됐다. 해당 artifact는 만료 전 상태로 보관 중이다. 그러나 정기 복구 리허설은 아직 기록되지 않았다.

## 우선순위 위험

| 우선순위 | 항목 | 영향 | 권고 |
|---|---|---|---|
| P0 | `auth` 스키마 및 Auth 설정이 현재 논리 DB 백업에 없음 | 새 Supabase 프로젝트 이전 시 기존 사용자 연결이 끊길 수 있음 | Auth 이전 전용 절차·설정 목록을 별도 암호화 백업 범위에 추가하고, 실제 복구 리허설 수행 |
| P0 | 개인키·복구 번들 자동 외부 보관 없음 | 사용자가 기기와 키 백업을 같이 잃으면 E2EE 응답 복호화 불가 | 운영자에게 키 백업과 폼별 복구 번들을 서로 다른 두 장소에 보관하도록 강제 안내 |
| P1 | GitHub artifact 보관이 90일이며 한 제공자에 집중 | 장기 보관·계정 장애에 취약 | age 암호문만 두 번째 오프사이트 객체 저장소로 복제 |
| P1 | 정기 복구 리허설 없음 | 백업이 있어도 실제 복원이 실패할 수 있음 | 분기별 빈 Supabase 프로젝트로 암호문 백업 복원·RLS·행 수 점검 |
| P1 | PPTX 내보내기 의존성의 image-size 고위험 DoS 권고 | 악성 이미지가 포함된 내보내기에서 브라우저 자원 고갈 가능성 | 이미지 입력 종류·크기 제한 유지, 업스트림 수정 버전 추적, 내보내기 경로 별도 회귀 점검 |
| P2 | 일부 RLS 정책의 `auth.uid()` 반복 평가 | 데이터 증가 시 목록·버전 조회 저하 | 정책을 `(select auth.uid())` 형태로 단계적 최적화 |
| P2 | 보안 권고: 유출 비밀번호 보호 비활성 | 비밀번호 로그인 도입 시 위험 증가 | Google OAuth만 쓰더라도 설정 활성화 검토 |

## 선택 가능한 오프사이트 보관 방식

| 방식 | 동작 | 장점 | 한계 |
|---|---|---|---|
| GitHub 암호화 artifact 유지 | 현재 방식, 90일 보관 | 이미 작동 중, 추가 비용 없음 | GitHub 한 곳에 집중, 장기 보관 한계 |
| Cloudflare R2에 age 암호문 복제 | 매일 생성한 암호문을 두 번째 객체 저장소에 복사 | R2 무료 구간 10GB·월, 100만 Class A 작업·월, egress 무료로 파일럿 규모에 적합 | Access Key를 Actions Secret으로 추가해야 함 |
| 운영자 수동 오프라인 보관 | 복구 번들·age 개인키를 암호화 USB와 비밀번호 관리자에 이중 보관 | 공급자 계정 장애와 독립 | 사용자가 정기적으로 갱신해야 함 |
| Supabase 유료 PITR | 지정 시점으로 복원 | 가장 짧은 RPO | 공식 문서상 7일 기준 약 월 100달러로 현 예산과 맞지 않음 |

## 참고 문헌

[1] [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups)  
[2] [Supabase CLI — db dump](https://supabase.com/docs/reference/cli/supabase-db-dump)  
[3] [Supabase — Migrating Auth Users Between Projects](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects)  
[4] [Cloudflare R2 — Pricing](https://developers.cloudflare.com/r2/pricing/)  
[5] [GitHub — Artifact retention](https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization)
