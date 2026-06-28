# 박재영 — 포트폴리오

웹·모바일 9년차 개발자의 개인 포트폴리오 사이트입니다. 프로젝트마다 **직접 조작 가능한 인터랙티브 데모**를 두어, 무엇을·왜·어떻게 해결했는지를 글이 아니라 경험으로 전달하는 것을 목표로 합니다.

> ⚠️ **안내**: 이 저장소의 코드는 **[Claude Code](https://claude.com/claude-code)** 를 통해 작성되었습니다. 따라서 코드 스타일·구조는 작성자(박재영)의 실제 코드 스타일과 다를 수 있습니다.

## 기술 스택

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** — 다크 테마 디자인
- **framer-motion** — 스크롤/등장 애니메이션
- **lucide-react** — 아이콘
- **JetBrains Mono** (`next/font`) — 터미널 타이핑 UI 폰트
- **i18n** — 한국어 / English 전환 (`LanguageContext` + `lib/translations.ts`)

## 주요 특징

- **멀티 페이지 구성** — 소개(홈) / 경력 / 프로젝트 분리
- **터미널 타이핑 Hero** — 커맨드 창처럼 기술 스택 문구를 타이핑→백스페이스로 순환
- **임팩트순 정렬 + 별점** — 프로젝트를 임팩트 순으로 정렬하고 ★(3·2·1)로 표시
- **회사별 필터** — 경력 카드의 "프로젝트 모아보기" → 프로젝트 페이지에서 회사 라벨로 필터
- **프로젝트별 인터랙티브 데모** — 각 상세 페이지에서 핵심 기능/원리를 직접 조작
- **한·영 다국어 지원**

## 페이지 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 소개(Hero·스킬·경력 요약·대표 프로젝트·연락) |
| `/career` | 경력 상세 (회사별 큰 카드 — 업무 서술 + 프로젝트 리스트) |
| `/projects` | 전체 프로젝트 (임팩트순 정렬·회사 필터·별점) |
| `/projects/[slug]` | 프로젝트 상세 + 인터랙티브 데모 |

## 프로젝트 상세 (인터랙티브 데모)

| 프로젝트 | 회사 | 데모 |
| --- | --- | --- |
| nginx + Lua 분산 캐시 서버 | Catenoid | 블록 슬라이스 분산 캐시 시뮬레이터 (HIT/MISS) |
| 카테고리 트리 렌더링 성능 개선 | Catenoid | O(N²)→O(N) 성능 레이스 · 가상 스크롤 비교 · 5단 셀렉터 |
| 정기 결제 시스템 구축 | Karoom | 빌링키 정기결제 플로우 시뮬레이터 |
| GitOps CI/CD 파이프라인 | Catenoid | ArgoCD 자동 배포 시뮬레이터 (build_number 트러블슈팅) |
| Docker 런타임 환경변수 | Catenoid | 빌드 1회 → 환경변수 주입 시뮬레이터 |
| Google Sheets i18n 자동화 | Catenoid | 시트 → i18n 파일 빌드 시뮬레이터 |
| 파일 라이브 편성 UI | Catenoid | 드래그앤드롭 편성 캘린더 (다중/순서 변경) |
| CRM 컬럼 글자색 커스터마이징 | BOBMC | 실시간 색상 미리보기 데모 |
| 카룸 PDF 견적서 다운로드 | Karoom | react-pdf 이미지 렌더링 버그 해결 데모 |

## 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

```bash
npm run build   # 프로덕션 빌드
npm run start   # 빌드 결과 실행
```

## 디렉터리 구조

```
app/
  page.tsx            # 홈(소개)
  career/page.tsx     # 경력 상세
  projects/
    page.tsx          # 전체 프로젝트 (필터/정렬)
    [slug]/page.tsx   # 프로젝트별 상세 + 데모
components/           # Hero, TerminalIntro, Skills, Experience, CareerDetail, Projects, Contact ...
lib/
  translations.ts     # 한/영 텍스트
  careerData.ts       # 회사 ↔ 프로젝트 매핑
contexts/
  LanguageContext.tsx # 언어 전환
```
