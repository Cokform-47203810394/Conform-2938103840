# Cokform 이식 패키지 안내

이 압축 파일은 콕폼을 새 컴퓨터·새 AI·새 협업 환경으로 옮겨 **계속 개발·운영·검증**할 수 있게 만든 안전한 인수인계 패키지다.

## 압축을 풀기 전 알아둘 점

이 패키지에는 코드, 문서, 2,000개 운영 매뉴얼, 생성기, Supabase 마이그레이션과 Edge Function 코드, GitHub Actions 설정, 파일 무결성 인벤토리가 들어 있다.

이 패키지에는 실제 OAuth 비밀값, Cloudflare·GitHub·Supabase 토큰, 개인키, 복구 비밀번호, 키 백업, 실제 응답 원문, 브라우저 로그인 세션, 원본 대화 전문이 들어 있지 않다. 이들은 사용자의 통제권과 보안을 위해 별도로 관리해야 한다.

## 시작 순서

1. `docs/AI_AND_OPERATOR_START_HERE.md`
2. `docs/MASTER_CONTEXT_COKFORM_CURRENT.md`
3. `docs/transfer/RESTORE_AND_CONTINUE.md`
4. `docs/operations-manuals/00-core-playbooks.md`
5. 현재 역할·업무·상황에 맞는 `docs/operations-manuals/INDEX.csv` 항목

## 무결성 확인

```bash
cd Cokform-Conform-2938103840
python3 scripts/verify_transfer_inventory.py
```

`Missing: 0`, `Changed: 0`이어야 한다. 다르면 배포하지 말고 파일이 올바르게 풀렸는지 먼저 확인한다.

## 설치와 기본 검수

```bash
npm ci
npm run build
```

서비스 연결 전에는 실제 사용자 데이터가 아닌 더미 폼과 더미 응답으로만 검수한다.

## 2,000개 매뉴얼 체계

- 20개 역할·도메인
- 도메인당 10개 반복 업무
- 업무당 10개 상황
- 총 2,000개 실행 체크리스트

세부 매뉴얼은 생성 파일이다. 구조를 바꿔야 하면 `scripts/generate_manual_system.py`와 `docs/operations-manuals-source/`를 먼저 수정한 뒤 재생성한다.

## 지원·보안의 절대 금지선

개인키, 복구 비밀번호, 키 백업, 실제 응답 원문, 토큰을 어떤 채팅·이슈·문서·분석 도구에도 붙이지 않는다. 문제가 생기면 폼 ID, 발생 시각, 브라우저, 민감정보를 제거한 오류 문구만 수집한다.
