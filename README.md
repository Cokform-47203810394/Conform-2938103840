# 콕폼 (Cokform)

구글 폼 + 네이버 폼 기능을 합친 설문/지원서 빌더. Material Design 3 스타일 + 네이버폼식 개인정보 동의·안내 문항 지원. 여러 개의 폼을 홈 화면에서 템플릿으로 생성하고, 목록에서 관리합니다.

## 시작하기

```bash
npm install
npm run dev
```

`http://localhost:5173` 에서 확인.

배포용 빌드:

```bash
npm run build
npm run preview
```

## 화면 구조

- **홈** (`pages/HomePage.jsx`) — 템플릿 갤러리(빈 양식/연락처정보/행사참석여부/파티초대/티셔츠신청/행사등록) + 최근 설문지 목록(검색, 정렬, 열기/사본/삭제)
- **편집기** (`pages/FormEditorPage.jsx`) — 질문 / 미리보기 / 응답 / 설정 4개 탭. 상단 뒤로가기로 홈 복귀
- **설정** (`pages/SettingsPage.jsx`) — 데이터 저장소(Supabase) 연동, 계정(Google 로그인)

## 폴더 구조

```
src/
  App.jsx                  홈 ↔ 편집기 ↔ 설정 라우팅
  main.jsx                 React 렌더 엔트리
  theme.js                 디자인 토큰 (M3 컬러, 네이버 그린, 타입별 컬러, elevation)
  questionTypes.js         문항 타입 정의, 기본값 생성기
  templates.js             홈 화면 템플릿 갤러리 정의
  components/
    QuestionEditor.jsx     문항 편집 카드
    QuestionField.jsx      응답자용 문항 렌더링
    PreviewForm.jsx         미리보기 + 제출 검증
    ResponsesView.jsx       응답 요약/통계
    FormThumbnail.jsx       카드용 축약 미리보기
    Bar.jsx                 막대그래프
    Primitives.jsx          아이콘버튼, 토글스위치
  pages/
    HomePage.jsx             템플릿 갤러리 + 최근 설문지 목록
    FormEditorPage.jsx       폼 편집기 (질문/미리보기/응답/설정 탭)
    SettingsPage.jsx         데이터저장소·계정연동 설정 화면
  lib/
    formsStore.js             폼 목록/문서 CRUD (Supabase 연동 시 클라우드, 아니면 localStorage)
    supabaseClient.js         Supabase 클라이언트 (설정탭에서 저장한 값 사용)
    auth.js                   구글 로그인 (Supabase Auth 기반)
```

## 이번에 추가된 기능

- **리치텍스트** — 설문 설명, 문항 제목에서 굵게/기울임/밑줄/취소선 지원 (`RichTextInput.jsx`, 새 라이브러리 없이 `execCommand` 사용). 공유 링크로 남에게 노출되는 콘텐츠라 렌더링 전 항상 허용 태그만 남기는 새니타이저(`lib/sanitizeRichText.js`)를 거칩니다.
- **페이지 배경색** — 팔레트 팝오버에 테마색과 별도로 배경색 스와치 추가.
- **기업 · 기관용 프리미엄 템플릿** — 채용 지원서 / 회원 가입 신청서 / 고객 만족도 조사 / 개인정보 처리 동의서 / 사내 피드백 조사. 전부 개인정보 동의·안내 문항이 기본 내장. 홈 화면에 PRO 배지로 구분되지만 **결제 게이팅은 아직 없습니다** — 나중에 결제를 붙일 때 이 배지 자리에 게이트를 걸면 됩니다.



- **공유 링크** — 상단 링크 아이콘 또는 "게시" 버튼으로 `?respond=<formId>` 링크를 복사합니다. 이 링크로 들어오면 편집기 UI 없이 응답 화면만 뜹니다 (`pages/RespondPage.jsx`). Supabase를 `.env`에 빌드 시점부터 설정해두면, 배포 후 누구에게 보내도 정상 작동합니다.
- **실행 취소 / 다시 실행** — 0.6초 동안 입력이 없으면 하나의 히스토리 체크포인트로 묶입니다. 외부 라이브러리 없이 `useState` 두 개로 구현.
- **폼별 테마 색상** — 상단 팔레트 아이콘에서 선택. 헤더 상단바 · 제출 버튼 · 탭 인디케이터 · FAB에 전부 반영됩니다.
- **즐겨찾기** — 상단 별 아이콘.
- **문항 드래그 재정렬** — 데스크톱은 카드 상단 손잡이(⋮⋮)로 드래그. 모바일/터치는 각 카드 케밥(⋮) 메뉴의 "위로/아래로/맨 위로/맨 아래로 이동"으로 대체.
- **폼별 응답 설정** (설정 탭) — 이메일 수집 표시, 응답 1회 제한(브라우저 기준), 응답 받는 중 on/off. 꺼두면 공유 링크로 들어와도 제출이 막힙니다.
- **공동작업자** — 이메일 목록을 폼 문서에 저장합니다. **실제 초대 메일은 발송되지 않습니다** — 진짜 이메일 발송이 필요하면 Supabase Edge Function + 이메일 API(Resend 등) 연동이 별도로 필요합니다.



기본 상태에서는 브라우저 로컬 저장소에만 저장됩니다. 클라우드 저장 + 로그인을 쓰려면:

1. [supabase.com](https://supabase.com) 에서 무료 프로젝트 생성
2. SQL Editor에서 아래 테이블 생성:

   ```sql
   create table forms (
     id text primary key,
     title text,
     data jsonb,
     owner uuid references auth.users(id),
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   alter table forms enable row level security;

   -- 소유자만 자기 폼을 읽고 쓸 수 있음
   create policy "owner can read own forms" on forms
     for select using (auth.uid() = owner);
   create policy "owner can write own forms" on forms
     for insert with check (auth.uid() = owner);
   create policy "owner can update own forms" on forms
     for update using (auth.uid() = owner);
   create policy "owner can delete own forms" on forms
     for delete using (auth.uid() = owner);
   ```

   > **주의**: owner 컬럼을 쓰려면 로그인이 필수가 됩니다. 지금 코드(`formsStore.js`)는 로그인 없이도 저장 가능하게 되어 있어서, RLS를 걸려면 "로그인 강제 여부"부터 먼저 정하고 저장 로직에 `auth.uid()`를 같이 넣도록 고쳐야 해요. 응답 제출(respond 링크)은 로그인 없는 제3자도 해야 하니, 실제로는 폼 테이블과 응답 테이블을 분리해서 응답 테이블에는 "누구나 insert 가능 / select·update·delete는 owner만" 정책을 별도로 거는 구조가 안전합니다.

3. 프로젝트 설정 → API 에서 `Project URL` 과 `anon public key` 복사
4. 앱 실행 후 **설정 탭**에 붙여넣고 저장
   - 또는 배포 시 고정하고 싶다면 `.env` 파일에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 로 저장 (`.env.example` 참고)
5. 구글 로그인을 쓰려면 Supabase 대시보드 → Authentication → Providers → Google 활성화

연동 후에는 `src/lib/formsStore.js` 가 자동으로 Supabase 우선 사용 → 실패 시 로컬 저장소로 폴백합니다. 홈 화면의 "최근 설문지" 목록도 이 저장소에서 불러옵니다.

## 스택

- React 18 + Vite
- Tailwind CSS
- lucide-react (아이콘)
- Supabase (선택적 — 계정연동/클라우드 저장)


## 보안 저장 구조 업데이트

폼 본문과 응답은 별도로 저장하는 구조를 사용합니다. 편집자 세션은 `forms`와 `form_public`을 갱신하고, 공개 응답자는 정제된 `form_public`만 읽은 뒤 `responses`에 답변을 삽입합니다. 공동작업자 이메일과 편집용 메타데이터는 공개 행에 복사하지 않습니다.

Supabase를 연결할 때는 `supabase/schema.sql`을 먼저 적용해야 합니다. 편집 저장은 로그인한 소유자만 가능하고, 공개 응답은 응답 삽입만 가능하며 기존 응답 조회·수정·삭제는 소유자만 가능합니다. 스키마를 적용하지 않으면 앱은 로컬 저장소로 동작하지만, 실제 서비스 배포 상태로 간주하면 안 됩니다.

응답 1회 제한은 브라우저 localStorage만으로는 보안 기능이 아닙니다. 현재 UI의 편의 제한이며, 서버 기준 중복 방지·rate limit·스팸 방어는 별도 출시 전 작업입니다. 또한 개인정보 처리방침·보관 기간·삭제 요청·법무 검토는 실제 서비스 공개 전에 완료해야 합니다.
