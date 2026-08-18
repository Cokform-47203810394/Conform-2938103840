# Cokform 문서

Cokform은 한국 실무 흐름에 맞춘 **개인정보 보호형 폼 빌더**입니다. 이 디렉터리는 제품 사용 방법, 응답 암호화와 키 관리, 개인정보 수집 운영, 내보내기·연동, 장애 대응 기준을 제품 문서로 관리합니다.

> 공개 문서 허브는 [`https://cokform.pages.dev/docs`](https://cokform.pages.dev/docs)에서 제공합니다. 저장소 문서는 제품 변경과 함께 검토·갱신하는 기준 원본입니다.

## 빠른 시작

| 목적 | 문서 | 핵심 내용 |
|---|---|---|
| 첫 폼 만들기 | [폼 만들기와 공유](guides/create-and-share.md) | 로그인, 질문 추가, 암호화 키 생성, 공개 링크 공유 |
| 응답 운영 | [응답 운영과 내보내기](guides/responses-and-exports.md) | 응답 기간, 이메일 기록, 중복 제한, CSV·Excel·JSON·요약 내보내기 |
| 개인정보 보호 | [보안과 키 관리](security/e2ee-and-key-management.md) | E2EE 경계, 개인키 금고, 복구 비밀번호·키 백업·복구 번들 |
| 실무 고지 | [개인정보 수집 운영](guides/privacy-operations.md) | 수집 목적·항목·보유기간 고지, 동의 질문, 보관기간 설정 |
| 문제가 생겼을 때 | [문제 해결](guides/troubleshooting.md) | 금고 잠김, 응답 미수신, 공개 링크·마감·내보내기 점검 |
| 브랜드 사용 | [브랜드 리소스](brand-resources.md) | 로고·마크·색상·사용 원칙·문의 |
| 국외 처리 | [국외이전·국외 처리 안내](legal/international-data-transfer.md) | 실제 국내 저장 구조, 조건부 외부 연동, 고지 항목 |
| 이용제한 | [서비스 이용제한 정책](legal/service-restrictions.md) | 금지행위, 비례적 조치, 통지·소명·보안 제보 |

## 문서 원칙

Cokform 문서는 과장하지 않습니다. 암호화가 적용되는 범위, 작성자가 직접 보관해야 하는 키, 플랫폼과 폼 운영자의 역할을 구분해 설명합니다.

| 주체 | 책임 범위 |
|---|---|
| Cokform 플랫폼 | 공개 폼 제공, 암호문 저장 경로, 키 금고·백업 도구, 기능 안정성 |
| 폼 작성자 | 수집 목적·항목·보유기간 고지, 응답 권한과 공개 범위, 복구 비밀번호·백업 파일 보관 |
| 응답자 | 공개 폼의 고지 확인, 필요한 정보만 제출, 이메일 사본 요청 여부 선택 |

## 문서 구조

```text
/docs
├── README.md                         # 이 문서와 전체 안내
├── brand-resources.md                # 로고·마크·색상·사용 원칙
├── guides/
│   ├── create-and-share.md           # 폼 제작·공개·공유
│   ├── responses-and-exports.md      # 응답 운영·내보내기
│   ├── privacy-operations.md         # 개인정보 수집 운영
│   └── troubleshooting.md            # 문제 해결
├── legal/
│   ├── international-data-transfer.md # 국외이전·국외 처리 안내
│   └── service-restrictions.md        # 서비스 이용제한 정책
└── security/
    └── e2ee-and-key-management.md   # E2EE·개인키·복구
```

## 유지 관리

제품 기능을 추가하거나 변경할 때는 관련 문서와 공개 `/docs` 허브를 같은 변경 단위에서 갱신합니다. 보안·법률 문구는 기능 동작과 맞는지 재검토하고, 불확실한 사항은 확정처럼 표현하지 않습니다.

---

마지막 검토: 2026-08-18
