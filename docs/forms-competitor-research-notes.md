# Cokform 경쟁 서비스 조사 메모

조사일: 2026-08-18 (KST)

## Google Forms 공식 근거

Google Forms는 질문·설명·이미지·동영상을 합산해 최대 300개 콘텐츠를 넣을 수 있고, 최대 75개 섹션으로 폼을 구성할 수 있다. 질문과 답변 순서를 응답자별로 섞을 수 있고, 응답 임시저장은 기본 30일이며 해제도 가능하다. 출처: https://support.google.com/docs/answer/2839737?hl=en

객관식과 드롭다운은 답변에 따라 특정 섹션으로 이동하거나 즉시 제출하게 하는 분기 조건을 지원한다. 섹션 단위로 다음 이동 경로도 지정할 수 있다. 출처: https://support.google.com/docs/answer/141062?hl=en

Google Forms의 제품 페이지는 여러 질문 유형, 드래그 정렬, 브랜드 색·이미지·글꼴, 답변 기반 로직, 실시간 차트, Google Sheets 연동, 실시간 공동편집, 이메일·링크·웹사이트 임베드 공유, 응답 검증을 명시한다. 출처: https://www.googleapps.com/forms/about/

Google 공식 도움말은 새 응답 이메일 알림을 지원하고, 더 많은 알림·맞춤 후속 메일은 add-on으로 확장한다고 안내한다. 출처: https://support.google.com/docs/answer/139706?hl=en

Google Forms는 공개 전 Publish가 필요하며, 링크 보유자·특정 대상·도메인·신뢰 대상·그룹 기반 응답자 접근을 설정하고 응답자 접근 만료일도 둘 수 있다. 출처: https://support.google.com/docs/answer/2839588?hl=en

Google Forms는 퀴즈를 만들어 자동 요약, 자주 틀린 문항, 정답 표시 그래프, 평균·중앙값·점수 범위를 제공하며, 개별 응답 채점·피드백·점수 이메일 발송을 지원한다. 출처: https://support.google.com/docs/answer/7032287?hl=en-GB

## NAVER Form 공식 근거

NAVER Form은 필수 답변 질문을 지원하고, 필수 응답이 비어 있으면 다음 페이지 이동과 제출을 막는다. 출처: https://help.naver.com/service/30040/contents/22534?lang=ko&osType=COMMONOS

NAVER Form은 페이지 추가로 질문을 묶어 단계별 설문을 구성할 수 있다. 출처: https://help.naver.com/service/30040/contents/22627?lang=ko&osType=COMMONOS

NAVER Form의 결과 화면은 종합 결과, 참여자별 결과, 일자별 참여수로 나뉘며 최근 30일 데이터를 일자별 그래프로 제공한다. 출처: https://help.naver.com/service/30040/contents/22639?lang=ko&osType=COMMONOS

검색 결과상 NAVER Form 고객센터에는 엑셀 다운로드, 결과 공유, 개인정보 수집 운영 관련 도움말이 존재한다. 세부 본문은 텍스트 추출 품질 제한으로 직접 인용하지 않았다.

## 조사 한계

NAVER Form 본 서비스 URL은 현재 브라우저 정책상 접근이 차단되어 실제 UI 세부 동선은 공식 고객센터와 공개 자료를 우선 근거로 사용한다. 기능 존재 여부가 공식 본문으로 확인되지 않은 항목은 보고서에서 ‘확인 불가’ 또는 ‘추가 검증 필요’로 표시한다.

## NAVER Form 공개 PC 캡처 추가 관찰

검색 결과의 공개 캡처 두 장을 시각 검토했다. 첫 번째 캡처는 편집 화면의 `설문 편집`·`설문 결과` 탭, 질문 카드, `질문 추가`, `페이지 추가`, 상단 아이콘과 별도의 `설문 기간` 모달을 보여준다. 이 모달은 시작과 종료를 각각 ‘바로 시작/직접 설정’, ‘제한 없음/직접 설정’으로 고를 수 있고 날짜와 시각을 지정한다. 따라서 NAVER Form에는 최소한 시작·종료 시각 기반 자동 공개·마감 UX가 실제 화면 수준에서 존재한다고 볼 수 있다. 출처 이미지: /home/ubuntu/upload/search_images/6WWLpLwsIqEE.jpg (검색 결과 제목: 네이버폼 설문조사 만들기 : 결과 확인 방법).

두 번째 캡처는 `내 설문`과 `참여한 설문`을 분리하고, `설문 만들기` CTA와 함께 직접 만들기, 객관식, 객관식(복수 선택), 주관식 서술형, 별점형, 표형, 표형+객관식+주관식, 객관식+주관식 시작 카드를 제공하는 PC 홈을 보여준다. Cokform의 템플릿 카드는 목적 중심이라는 장점이 있지만, NAVER Form은 질문 구조 중심 시작점도 제공해 초보자가 첫 폼을 빠르게 만들 수 있게 한다. 출처 이미지: /home/ubuntu/upload/search_images/eY6pCjl439zs.png (검색 결과 제목: 네이버폼 설문조사 만들기 QR코드 공유, 결과 엑셀 다운로드).

직접 `form.naver.com`과 `www.naver.com`으로의 브라우저 탐색은 현재 세션에서 정책 차단됐다. PC 환경 진입 후에도 연결된 브라우저가 아닌 Sandbox 브라우저로 응답해 직접 로그인·폼 생성·제출·결과 조작은 완료하지 못했다. 따라서 이번 보강은 공개 캡처 관찰과 공식 고객센터의 교차 검증에 한정한다.
