// 경력 ↔ 프로젝트 회사 매핑 (CareerDetail / Projects 공용)
export type CompanyKey =
  | "catenoid"
  | "happybridge"
  | "karoom"
  | "bobmc"
  | "smartgate"
  | "studyplatform"
  | "travelplatform";

// experience.items 순서(최신순)와 1:1 — 0 카테노이드, 1 해피브릿지, 2 카룸, 3 BOBMC, 4 스마트게이트, 5 스터디 플랫폼(대외활동), 6 여행 플랫폼(대외활동)
export const EXPERIENCE_KEYS: CompanyKey[] = [
  "catenoid",
  "happybridge",
  "karoom",
  "bobmc",
  "smartgate",
  "studyplatform",
  "travelplatform",
];

// 프로젝트 detailLink → 회사 키
export const PROJECT_COMPANY: Record<string, CompanyKey> = {
  "/projects/vod-migration": "catenoid",
  "/projects/google-i18n": "catenoid",
  "/projects/category-tree": "catenoid",
  "/projects/docker-env": "catenoid",
  "/projects/file-live": "catenoid",
  "/projects/cicd": "catenoid",
  "/projects/nginx-cache": "catenoid",
  "/projects/payment-system": "karoom",
  "/projects/karoom-pdf": "karoom",
  "/projects/bobmc-crm": "bobmc",
};

export const COMPANY_LABELS: Record<"ko" | "en", Record<CompanyKey, string>> = {
  ko: {
    catenoid: "카테노이드",
    happybridge: "해피브릿지",
    karoom: "(주)카룸",
    bobmc: "BOBMC",
    smartgate: "스마트게이트",
    studyplatform: "스터디 플랫폼",
    travelplatform: "여행 플랫폼",
  },
  en: {
    catenoid: "Catenoid",
    happybridge: "HappyBridge",
    karoom: "Karoom",
    bobmc: "BOBMC",
    smartgate: "SmartGate",
    studyplatform: "Study Platform",
    travelplatform: "Travel Platform",
  },
};

export const companyOf = (detailLink: string | null): CompanyKey | null =>
  detailLink ? PROJECT_COMPANY[detailLink] ?? null : null;

// 회사별 프로젝트 목록 (상세 페이지 없는 것 포함) — 경력 카드 우측 리스트용
export interface CareerProject {
  ko: string;
  en: string;
  detailLink?: string;
}

export const COMPANY_PROJECTS: Record<CompanyKey, CareerProject[]> = {
  catenoid: [
    { ko: "VOD Console Vue2 → Next.js 마이그레이션", en: "VOD Console Vue2 → Next.js Migration", detailLink: "/projects/vod-migration" },
    { ko: "카테고리 트리 렌더링 성능 개선", en: "Category Tree Performance Fix", detailLink: "/projects/category-tree" },
    { ko: "nginx + Lua 분산 캐시 서버", en: "nginx + Lua Distributed Cache", detailLink: "/projects/nginx-cache" },
    { ko: "GitOps CI/CD 파이프라인 구축", en: "GitOps CI/CD Pipeline", detailLink: "/projects/cicd" },
    { ko: "Docker 런타임 환경변수 주입", en: "SPA Runtime Env via Docker", detailLink: "/projects/docker-env" },
    { ko: "Google Sheets 기반 i18n 자동화", en: "Google Sheets i18n Automation", detailLink: "/projects/google-i18n" },
    { ko: "파일 라이브 편성 UI 고도화", en: "File Live Scheduling UI", detailLink: "/projects/file-live" },
  ],
  happybridge: [
    { ko: "양자 암호화 블록체인 플랫폼", en: "Quantum Blockchain Platform" },
  ],
  karoom: [
    { ko: "정기 결제 시스템 구축", en: "Recurring Payment System", detailLink: "/projects/payment-system" },
    { ko: "카룸 PDF 견적서 다운로드", en: "Karoom PDF Estimate Download", detailLink: "/projects/karoom-pdf" },
    { ko: "카룸 AI 수리 견적 시스템", en: "Karoom AI Repair Estimator" },
    { ko: "미모 뷰티 서비스 앱", en: "Mimo Beauty Service App" },
  ],
  bobmc: [
    { ko: "CRM 컬럼 글자색 커스터마이징", en: "CRM Column Color Customization", detailLink: "/projects/bobmc-crm" },
  ],
  smartgate: [
    { ko: "KT IDC 2센터 스위치 네트워크 설계", en: "KT IDC Center 2 Switch Network Design" },
    { ko: "LG전자 창원 공장 스위치 네트워크 설계", en: "LG Electronics Changwon Plant Switch Network Design" },
  ],
  studyplatform: [
    { ko: "스터디 매칭·펀딩 플랫폼", en: "Study Matching & Funding Platform" },
  ],
  travelplatform: [
    { ko: "스타트업 여행 플랫폼", en: "Startup Travel Platform" },
  ],
};
