# Cokform 법률·보안 감사

> **작업용 감사 기록 — 정식 법률 자문이나 침해 테스트 보고서가 아닙니다.** 이 문서는 Cokform 소유자의 승인에 따라 공개 페이지, 저장소 코드, 계정 설정을 비파괴 방식으로 점검한 결과를 기록합니다. 실제 대표자·사업자·위탁계약·보안 인증 현황은 확인된 사실만 반영해야 하며, 정식 서비스 공개 전에는 한국 변호사와 보안 전문가의 검토가 필요합니다.

## 점검 범위와 경계

점검 대상은 `cokform.pages.dev`, Cokform 공개 정적 자산, React 코드, Supabase 프로젝트의 읽기 전용 보안 점검, Cloudflare 계정의 읽기 전용 설정 확인입니다. 서비스 중단, 무차별 대입, 타인 계정 접근, 응답 평문·키 추출, 데이터 생성·변조·삭제, 권한 우회는 범위에서 제외합니다.

## 공식 기준

개인정보보호위원회는 개인정보 처리방침을 적정하고 투명하게 작성·공개하기 위한 지침을 제공하며, 개인정보 보호법 시행령 제31조는 처리 항목, 국외이전의 근거·세부 사항, 안전성 확보조치 및 해외 직접 수집 국가를 처리방침에 포함하도록 규정합니다. 시행령은 처리방침을 인터넷 홈페이지에 지속적으로 게재하도록 정합니다.[^pipa-guideline] [^pipa-decree]

개인정보보호위원회의 국외이전 안내는 국외 제공·처리위탁·보관 또는 해외 조회가 국외이전에 해당할 수 있으며, 별도 동의·계약 이행을 위한 위탁·보관·인증·동등성 인정 등 법적 근거와 보호조치를 요구한다고 설명합니다.[^pipc-crossborder]

Cloudflare 공식 문서는 Data Localization Suite를 별도로 설정해야 HTTPS 복호화·처리 위치와 트래픽 메타데이터·로그 보관 위치를 제어할 수 있다고 안내합니다. 별도 경계가 없으면 고객 로그는 글로벌 코어 데이터센터에서 처리·보관될 수 있습니다.[^cloudflare-dls] [^cloudflare-cmb]

## 초기 법률 고지 점검 결과

| 우선순위 | 확인 사항 | 판단 | 필요한 조치 |
| --- | --- | --- | --- |
| P0 | 개인정보처리방침의 개인정보 보호책임자, 사업자·대표자·주소, 실제 수탁자별 보관기간·연락처가 미확정 | 실제 사실을 공개하지 못한 상태여서 정식 대외 서비스 고지로는 불완전함 | 실제 정보 확인 뒤 방침·약관·국외이전 표에 일괄 반영 |
| P0 | 국외이전 표의 Cloudflare 처리자·국가·보유기간·연락처·법적 근거가 포괄적 표현에 머묾 | 시행령 제31조의 구체 공개 취지에 부족할 위험 | 실제 계약·기능·지역을 확인해 표를 확정하고, 확인 전에는 단정적 표현 금지 |
| P1 | 개인정보처리방침이 항목별 처리 목적, 플랫폼 메타데이터의 보유기간, 파기 방법, 수탁자 목록, 권리 행사 절차·담당자 정보를 완결적으로 구분하지 않음 | 이용자가 자기 정보 처리 방식을 예측하기 어려움 | ‘처리 목적·항목·보유기간’, ‘처리위탁’, ‘파기’, ‘안전성 조치’, ‘권리 행사’, ‘보호책임자’ 단락으로 분리 |
| P1 | 이용약관에 약관 변경 사전 고지, 이용 종료·계정 탈퇴·데이터 처리, 사업자 표시, 서비스 요금·유료 전환 기준이 구체적이지 않음 | 소비자·계약 분쟁 시 해석 리스크 | 실제 운영 모델 확정 후 별도 조항 보완 |
| P1 | 개인정보 동의 템플릿의 기본 목적·항목·보관기간이 범용 예시이며, 폼 질문과 자동 대조되지 않음 | 폼 운영자가 실제와 다른 동의를 받을 위험 | 템플릿에 경고·검증을 추가하고 운영자 입력 책임을 명확히 고지 |

## 초기 인프라 사실

Cloudflare Regional Services 바인딩 읽기 요청은 `1101: forbidden: account not entitled for regional services for BYOIP`를 반환했습니다. 이 결과만으로 모든 Cloudflare 데이터 현지화 설정 부재를 단정할 수는 없지만, Cokform은 현 시점에 데이터 현지화가 적용됐다고 공개해서는 안 되며 Cloudflare의 글로벌 처리 가능성을 기준으로 국외 처리 고지를 보수적으로 유지해야 합니다.

[^pipa-guideline]: [개인정보 포털 — 2026 개인정보 처리방침 작성지침](https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20885)
[^pipa-decree]: [국가법령정보센터 — 개인정보 보호법 시행령 제31조](https://www.law.go.kr/LSW//lsLinkCommonInfo.do?lspttninfSeq=67000&chrClsCd=010202)
[^pipc-crossborder]: [개인정보보호위원회 — 국외이전 제도](https://www.pipc.go.kr/np/default/page.do?mCode=D060040010)
[^cloudflare-dls]: [Cloudflare Docs — Data Localization Suite](https://developers.cloudflare.com/data-localization/)
[^cloudflare-cmb]: [Cloudflare Docs — Customer Metadata Boundary](https://developers.cloudflare.com/data-localization/metadata-boundary/)

Supabase 관리 API의 읽기 전용 프로젝트 조회 결과, Cokform 프로젝트 `bnbdxcyarerrmijuvxdb`는 `ap-northeast-2` 리전에 있으며 상태는 `ACTIVE_HEALTHY`입니다. 따라서 Supabase의 주 데이터베이스 리전을 대한민국 서울로 고지한 내용은 이 점검 시점에 확인된 사실과 일치합니다. 이 사실은 Cloudflare 전송·엣지 처리 또는 사용자가 선택하는 Google 내보내기 처리 위치를 국내로 보장한다는 뜻은 아닙니다.
