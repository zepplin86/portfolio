export type Locale = "en" | "ko";

export const translations = {
  en: {
    nav: {
      about: "About",
      skills: "Skills",
      experience: "Experience",
      projects: "Projects",
      contact: "Contact",
      cta: "Contact",
    },
    hero: {
      greeting: "Hi, I'm",
      name: "Jaeyoung Park",
      title: "Frontend Developer",
      bio: "9+ years of experience across web and mobile development — from PHP-based platforms to React Native apps and blockchain systems. Focused on building reliable products that work end-to-end.",
      viewProjects: "View Projects",
      getInTouch: "Get in Touch",
    },
    skills: {
      label: "Tech Stack",
      title: "What I Work With",
    },
    experience: {
      label: "Experience",
      title: "Work History",
      items: [
        {
          company: "Catenoid",
          role: "Frontend Developer",
          period: "Jan 2022 — Present",
          summary: "Frontend & infrastructure for the VOD Console — maintenance, frontend split, Next.js migration, monorepo/design system, and an nginx + Lua cache server.",
          approach: "Catenoid runs a content-delivery SaaS similar to Vimeo, and because it layers security on top of plain playback, the system is genuinely complex. So even for a single feature, I didn't just look at my own slice — I read across the whole system to build a holistic understanding of how it behaves, and put real effort into getting the console's behavior and UI right from every angle. Since the work was largely maintenance-driven, I paid close attention to code design and structure, and led close collaboration with each feature's owner to keep the codebase clear and explicit.",
          description: [
            "Maintained PHP Laravel + Vue2 based VOD Console platform",
            "Separated VOD Console frontend into a standalone application",
            "Migrated VOD Console frontend from Vue2 to Next.js",
            "Built a monorepo and a shared design system for consistent UI across apps",
            "Developed a CDN cache server using nginx + Lua scripting",
          ],
          tech: ["PHP Laravel", "Vue2", "Next.js", "Monorepo", "Design System", "Nginx", "Lua"],
        },
        {
          company: "HappyBridge (Lumen Payments)",
          role: "Fullstack Developer",
          period: "Sep 2021 — Jan 2022",
          summary: "Built a quantum-encryption blockchain platform — REST APIs, a wallet service, and a React Native app.",
          approach: "I took part in a government R&D project on managing crypto wallets using quantum-encryption hardware. Its core was encryption/decryption via quantum-encryption devices: an authentication key issued by one device was received on the other side and used to decrypt quickly, keeping the blockchain wallets securely managed. On the app side, I implemented direct blockchain wallet management through Web3.js. Despite the unfamiliar domain, I ramped up quickly and delivered working results within a short period.",
          description: [
            "Led development of a blockchain platform using quantum encryption with go-ethereum infrastructure",
            "Built REST APIs with PHP Laravel and Node.js-based blockchain wallet generation service",
            "Developed cross-platform mobile app with React Native for blockchain wallet management",
          ],
          tech: ["PHP Laravel", "Node.js", "React Native", "Web3.js", "MySQL", "CentOS 8"],
        },
        {
          company: "Karoom",
          role: "Fullstack Developer",
          period: "Oct 2019 — Aug 2021",
          summary: "Nuxt SSR web and React Native apps, a TensorFlow AI repair estimator, and payment / location-based APIs.",
          approach: "Karoom's core domain is new-car sales, and I worked broadly across web, app, and backend. As an early-stage startup, every decision came down to one thing — survival — so I shipped multiple projects in short cycles to stay fast and flexible. A key example: I migrated the Vue2 webview-based Android and iOS apps to React Native, supporting both platforms from a single codebase and dramatically cutting maintenance overhead. I also took on the Mimo beauty-service app as an outsourced build, delivering a range of services quickly under tight resource constraints.",
          description: [
            "Built the Nuxt.js SSR platform web and renewed the Karoom homepage (SSR landing, PDF estimate download)",
            "Developed a new-car dealer matching app (React Native) and the Karoom Partners portal (Node.js, Vue.js)",
            "Built and maintained payment systems including KG Inicis recurring billing",
            "Built an AI car-repair cost estimator using TensorFlow image recognition",
            "Implemented a location-based API with data crawling",
          ],
          tech: ["React Native", "Vue.js", "Nuxt.js", "Next.js", "Node.js", "PHP Laravel", "TensorFlow"],
        },
        {
          company: "BOBMC",
          role: "Web Developer",
          period: "Jan 2018 — Apr 2019",
          summary: "CRM DB design & maintenance, PG integration, and statistics dashboard / auto-trading radar frontends.",
          approach: "Handled CRM data design and the frontend — from DB schema optimization to PG integration and statistics dashboards. Focused on quickly shipping feature improvements driven directly by user needs.",
          description: [
            "Designed and optimized CRM database schemas for internal and client-facing systems",
            "Integrated PG (payment gateway) and developed statistical dashboards with chart UIs",
            "Integrated HTS APIs and built an automated trading radar frontend, and maintained CRM systems",
          ],
          tech: ["PHP CodeIgniter", "MySQL", "MariaDB", "JavaScript", "jQuery"],
        },
        {
          company: "SmartGate",
          role: "Network Engineer",
          period: "Jun 2016 — Oct 2017",
          summary: "Network architecture and security policy setup (Cisco, Paloalto).",
          approach: "Designed and operated network infrastructure and security policies. Before moving into development, this built my foundation in how systems actually connect and run in production. I was responsible for designing and maintaining switches, routers, and firewalls — notably the switch network design for KT IDC Center 2 and the switch network design for the LG Electronics Changwon plant.",
          description: [
            "Designed network system architecture",
            "Established and implemented network security policies using Cisco and Paloalto equipment",
          ],
          tech: ["Cisco Switch", "Cisco Router", "Paloalto Firewall", "Fortinet Firewall"],
        },
        {
          tag: "Extracurricular",
          company: "Study Platform",
          role: "Fullstack Developer",
          period: "Aug 2015 — Apr 2016",
          summary: "Built a study matching & funding platform end-to-end — server, DB, and admin tools.",
          approach: "An extracurricular project where I owned the full stack on my own — from server setup and DB design to the admin dashboard — and shipped the core matching and funding features.",
          description: [
            "Full-stack development with server setup and architecture",
            "Designed and optimized the database, and built the admin dashboard",
            "Developed the study matching and funding features",
          ],
          tech: ["PHP CodeIgniter", "MySQL", "AWS EC2", "HTML", "CSS"],
        },
        {
          tag: "Extracurricular",
          company: "Travel Platform",
          role: "Fullstack Developer",
          period: "Jan 2015 — Jul 2015",
          summary: "Built a startup travel platform end-to-end — server, DB, and admin tools.",
          approach: "An extracurricular project for an early-stage startup where I handled the full stack — server setup, DB design, and the admin dashboard.",
          description: [
            "Full-stack development with server setup and architecture",
            "Designed and optimized the database",
            "Built the admin dashboard",
          ],
          tech: ["PHP", "MySQL", "AWS EC2", "HTML", "CSS"],
        },
      ],
    },
    projects: {
      label: "Projects",
      title: "Featured Work",
      items: [
        {
          title: "CRM Column Color Customization",
          description:
            "A CRM feature allowing users to customize text color per column in data tables. Includes real-time preview, RGB persistence in DB, and automatic dark-background contrast correction.",
          tech: ["PHP CodeIgniter", "MySQL", "jQuery", "Ajax"],
          detailLink: "/projects/bobmc-crm",
        },
        {
          title: "Karoom PDF Estimate Download",
          description:
            "Vehicle estimate PDF download feature with image rendering bug fix. Resolved a react-pdf issue where external S3 image URLs failed to load in new component instances by converting images to base64 before PDF generation.",
          tech: ["Next.js", "react-pdf", "FileReader API", "Base64", "AWS S3"],
          detailLink: "/projects/karoom-pdf",
        },
        {
          title: "Recurring Payment System",
          description:
            "Subscription billing system with KG Inicis PG integration. Designed the payment domain DB, implemented billing-key based auto-renewal every 30 days with cron scheduler, and a B2B multi-tenant (per-CP data isolation) structure.",
          tech: ["PHP Laravel", "KG 이니시스", "MySQL", "Cron Scheduler", "Billing Key"],
          detailLink: "/projects/payment-system",
        },
        {
          title: "Google Sheets i18n Automation",
          description:
            "Auto-generates i18n translation files from a Google Spreadsheet. Built a reusable I18nBuilderFromSheets module that authenticates via a service account, deep-merges dotted keys into nested objects, converts :params to {params}, and writes per-language files — so all translations are managed in the sheet.",
          tech: ["Google Sheets API", "Node.js", "Vue CLI", "PHP Laravel", "lodash"],
          detailLink: "/projects/google-i18n",
        },
        {
          title: "Category Tree Performance Fix",
          description:
            "Fixed a browser-freezing issue for customers with ~25,000 categories (up to 5 depth). Cut the flat-to-fullName processing from O(N²) to O(N) via level-sorted Map lookups, and replaced bulk rendering with vue-virtual-scroll-list and a depth-by-depth cascading selector.",
          tech: ["Vue", "vue-virtual-scroll-list", "Algorithm Optimization", "JavaScript"],
          detailLink: "/projects/category-tree",
        },
        {
          title: "SPA Runtime Env via Docker",
          description:
            "After splitting the frontend into a standalone SPA, env vars baked in at build time forced separate images per environment. Adopted jvjr-docker-env to build once with $VAR placeholders and inject real values at container startup via an entrypoint — one image for dev/stage/prod.",
          tech: ["Docker", "Nginx", "Vue", "jvjr-docker-env", "CI/CD"],
          detailLink: "/projects/docker-env",
        },
        {
          title: "File Live Scheduling UI",
          description:
            "Led a long-running side project (collaborating with planner & designer) to revamp the file-live scheduling UI. Drove it to a safe, on-time delivery via upfront requirement scoping, a dev server for weekly progress sharing, and fast feedback loops. Features: drag-and-drop scheduling onto a calendar, channel color coding.",
          tech: ["Vue", "fullcalendar.js", "dragula", "Project Lead"],
          detailLink: "/projects/file-live",
        },
        {
          title: "GitOps CI/CD Pipeline",
          description:
            "Built a GitHub Actions pipeline for the rancher→k8s/ArgoCD migration: pushing to a release branch auto-builds & pushes the image, updates Helm values in a GitOps repo, and lets ArgoCD deploy. Fixed ArgoCD not detecting same-tag redeploys by bumping a random build_number in the chart each run.",
          tech: ["GitHub Actions", "Docker", "Kubernetes", "ArgoCD", "Helm"],
          detailLink: "/projects/cicd",
        },
        {
          title: "nginx + Lua Distributed Cache",
          description:
            "Re-implemented a FUSE-filesystem distributed cache server with nginx + Lua so it fits k8s. Lua computes 10MB blocks from the HTTP Range and picks a cache node (dynamic upstream); nginx slice module fetches blocks and proxy_cache caches each slice — removing the physical-filesystem dependency.",
          tech: ["Nginx", "Lua / OpenResty", "proxy_cache", "slice module", "Kubernetes"],
          detailLink: "/projects/nginx-cache",
        },
        {
          title: "VOD Console Vue2 → Next.js Migration",
          description:
            "Led the migration of the legacy Vue2 VOD Console to Next.js. Researched React-ecosystem replacements for every Vue dependency, restructured the codebase with Feature-Sliced Design and a pnpm monorepo, and introduced a shared design system. Also brought in harness engineering (Claude Code plugins) and shared it across the team to shift how we work.",
          tech: ["Next.js", "React", "TypeScript", "FSD", "Monorepo", "Design System", "Zustand"],
          detailLink: "/projects/vod-migration",
        },
      ],
    },
    contact: {
      label: "Contact",
      title: "Get In Touch",
      subtitle: "Open to new opportunities and collaborations — feel free to reach out.",
      infoTitle: "Contact Info",
      infoBody:
        "Currently exploring new roles and freelance projects. Whether it's a job offer, a collaboration idea, or just a hello — my inbox is open.",
      namePlaceholder: "John Doe",
      nameLabel: "Name",
      emailLabel: "Email",
      messageLabel: "Message",
      messagePlaceholder: "Hi Jaeyoung, ...",
      send: "Send Message",
      sentTitle: "Message sent!",
      sentBody: "I'll get back to you as soon as possible.",
    },
    footer: "© 2026 Jaeyoung Park. Built with Next.js & Tailwind CSS",
  },

  ko: {
    nav: {
      about: "소개",
      skills: "기술",
      experience: "경력",
      projects: "프로젝트",
      contact: "연락",
      cta: "연락하기",
    },
    hero: {
      greeting: "안녕하세요, 저는",
      name: "박재영",
      title: "프론트엔드 개발자",
      bio: "웹과 모바일 개발 분야에서 9년 경력을 쌓았습니다. PHP 기반 플랫폼부터 React Native 앱, 블록체인 시스템까지 다양한 프로젝트를 경험했습니다.",
      viewProjects: "프로젝트 보기",
      getInTouch: "연락하기",
    },
    skills: {
      label: "기술 스택",
      title: "사용 기술",
    },
    experience: {
      label: "경력",
      title: "경력 사항",
      items: [
        {
          company: "카테노이드",
          role: "프론트엔드 개발자",
          period: "2022년 1월 — 현재 재직 중",
          summary: "VOD Console 프론트 유지보수·분리·Next.js 마이그레이션, 모노레포·디자인 시스템, nginx + Lua 캐시 서버 등 프론트 전반과 인프라 담당.",
          approach: "카테노이드는 Vimeo와 유사한 콘텐츠 딜리버리 SaaS로, 단순 재생을 넘어 보안까지 맞물려 있어 시스템 구조가 상당히 복잡합니다. 그래서 한 기능을 구현하더라도 제가 맡은 영역만 보는 것이 아니라 시스템 전반의 코드를 함께 살피며 전체 동작에 대한 이해도를 끌어올렸고, 콘솔에서 올바른 동작과 UI를 구현하기 위해 다방면으로 파고들었습니다. 유지보수 비중이 큰 업무 특성상 코드 설계와 관리에 특히 신경 썼으며, 코드의 명확성을 높이기 위해 각 기능 담당자들과 긴밀한 협업을 주도했습니다.",
          description: [
            "PHP Laravel + Vue2 기반 VOD Console 유지보수",
            "VOD Console 프론트엔드 분리 및 독립 애플리케이션으로 구성",
            "VOD Console 프론트엔드 Vue2 → Next.js 마이그레이션",
            "모노레포 구성 및 공통 디자인 시스템 구축으로 앱 간 UI 일관성 확보",
            "nginx + Lua를 활용한 CDN 캐시서버 개발",
          ],
          tech: ["PHP Laravel", "Vue2", "Next.js", "Monorepo", "Design System", "Nginx", "Lua"],
        },
        {
          company: "해피브릿지 (루멘페이먼츠)",
          role: "풀스택 개발자",
          period: "2021년 9월 — 2022년 1월",
          summary: "양자 암호화 블록체인 플랫폼 개발 — REST API, 지갑 생성 서비스, React Native 앱.",
          approach: "양자암호화 장비를 이용한 코인 지갑 관리를 주제로 한 정부 과제에 참여했습니다. 과제의 핵심은 양자암호화 장비를 활용한 암·복호화로, 한쪽 장비에서 발급한 인증키를 반대편에서 받아 빠르게 복호화하는 방식으로 블록체인 지갑을 안전하게 관리했습니다. 앱에서는 Web3.js를 통해 블록체인 지갑을 직접 관리하도록 구현했으며, 생소한 도메인이었지만 짧은 기간 안에 빠르게 적응해 동작하는 결과물을 만들어냈습니다.",
          description: [
            "양자 암호화 기반 블록체인 플랫폼 개발 및 go-ethereum 서버 인프라 구축",
            "PHP Laravel REST API 및 Node.js 기반 블록체인 지갑 생성 서비스 개발",
            "블록체인 지갑 관리를 위한 React Native 크로스플랫폼 앱 개발",
          ],
          tech: ["PHP Laravel", "Node.js", "React Native", "Web3.js", "MySQL", "CentOS 8"],
        },
        {
          company: "(주)카룸",
          role: "풀스택 개발자",
          period: "2019년 10월 — 2021년 8월",
          summary: "Nuxt SSR 웹·React Native 앱 개발, TensorFlow AI 수리 견적, 결제·위치기반 API 구축.",
          approach: "카룸의 핵심 도메인은 신차 판매로, 웹·앱·백엔드까지 폭넓게 담당했습니다. 초기 스타트업이었던 만큼 모든 의사결정의 기준은 '생존'이었고, 빠르고 유연하게 대응하기 위해 여러 프로젝트를 단기간에 진행했습니다. 대표적으로 Vue2 웹뷰 기반의 Android·iOS 앱을 React Native로 전환해 하나의 코드베이스로 두 플랫폼을 지원하며 유지보수 부담을 크게 줄였고, 미모 뷰티 서비스 앱은 외주로 맡아 진행하는 등 제한된 리소스 안에서 다양한 서비스를 빠르게 만들어냈습니다.",
          description: [
            "Nuxt.js 기반 플랫폼 웹 SSR 개발 및 카룸 홈페이지 리뉴얼(랜딩 SSR·견적서 PDF 다운로드)",
            "신차 딜러 매칭 앱(React Native)과 카룸 파트너스 포털(Node.js·Vue.js) 신규 개발",
            "KG이니시스 정기결제 등 결제 시스템 구축 및 유지보수",
            "TensorFlow 이미지 인식을 활용한 자동차 수리 견적 AI 개발",
            "위치기반 API 및 데이터 크롤링 구현",
          ],
          tech: ["React Native", "Vue.js", "Nuxt.js", "Next.js", "Node.js", "PHP Laravel", "TensorFlow"],
        },
        {
          company: "BOBMC",
          role: "웹 개발자",
          period: "2018년 1월 — 2019년 4월",
          summary: "CRM DB 설계·유지보수, PG 연동, 통계 대시보드·오토레이더 프론트 개발.",
          approach: "사내·외부 CRM의 데이터 설계와 프론트를 맡아 DB 스키마 최적화부터 PG 연동, 통계 대시보드까지 실무 전반을 경험했습니다. 사용자 요구를 빠르게 반영하는 기능 개선에 집중했습니다.",
          description: [
            "내부 및 외부 고객사 CRM 시스템 DB 설계 및 최적화",
            "PG 연동 및 통계 대시보드·그래프 프론트 개발",
            "HTS API 연동 및 오토레이더 프로그램 프론트 개발, CRM 유지보수",
          ],
          tech: ["PHP CodeIgniter", "MySQL", "MariaDB", "JavaScript", "jQuery"],
        },
        {
          company: "스마트게이트",
          role: "네트워크 엔지니어",
          period: "2016년 6월 — 2017년 10월",
          summary: "네트워크 설계 및 보안 정책 구축 (Cisco·Paloalto).",
          approach: "네트워크 인프라를 설계·운영하고 보안 정책을 수립했습니다. 개발자로 전향하기 전, 시스템이 실제로 어떻게 연결되고 운영되는지에 대한 인프라 감각을 다진 시기입니다. 이에 switch, router, firewall을 설계 및 유지보수를 담당하였습니다. 주요 설계 사례로는 KT IDC 2센터 스위치 네트워크 설계와 LG전자 창원 공장 스위치 네트워크 설계를 담당하였습니다.",
          description: [
            "네트워크 시스템 설계",
            "Cisco 및 Paloalto 장비를 활용한 네트워크 보안 정책 수립 및 구축",
          ],
          tech: ["Cisco Switch", "Cisco Router", "Paloalto Firewall", "Fortinet Firewall"],
        },
        {
          tag: "대외활동",
          company: "스터디 플랫폼",
          role: "풀스택 개발",
          period: "2015년 8월 — 2016년 4월",
          summary: "스터디 매칭·펀딩 플랫폼을 서버부터 관리자 페이지까지 풀스택으로 개발했습니다.",
          approach: "대외활동으로 진행한 프로젝트로, 서버 구축과 DB 설계부터 관리자 페이지까지 혼자 풀스택을 맡아 매칭·펀딩 핵심 기능을 끝까지 구현했습니다.",
          description: [
            "풀스택 개발 및 서버 구축·설계",
            "DB 설계 및 최적화, 관리자 페이지 개발",
            "스터디 매칭 및 펀딩 기능 개발",
          ],
          tech: ["PHP CodeIgniter", "MySQL", "AWS EC2", "HTML", "CSS"],
        },
        {
          tag: "대외활동",
          company: "여행 플랫폼",
          role: "풀스택 개발",
          period: "2015년 1월 — 2015년 7월",
          summary: "스타트업 여행 플랫폼을 서버부터 관리자 페이지까지 풀스택으로 개발했습니다.",
          approach: "초기 스타트업의 대외활동 프로젝트로, 서버 구축과 DB 설계, 관리자 페이지까지 풀스택을 담당했습니다.",
          description: [
            "풀스택 개발 및 서버 구축·설계",
            "DB 설계 및 최적화",
            "관리자 페이지 개발",
          ],
          tech: ["PHP", "MySQL", "AWS EC2", "HTML", "CSS"],
        },
      ],
    },
    projects: {
      label: "프로젝트",
      title: "주요 프로젝트",
      items: [
        {
          title: "CRM 컬럼 글자색 커스터마이징",
          description:
            "데이터 테이블의 컬럼별 글자색을 사용자가 직접 지정할 수 있는 CRM 기능. 실시간 미리보기, RGB DB 저장, 어두운 색상 자동 배경 대비 보정 포함.",
          tech: ["PHP CodeIgniter", "MySQL", "jQuery", "Ajax"],
          detailLink: "/projects/bobmc-crm",
        },
        {
          title: "카룸 PDF 견적서 다운로드",
          description:
            "차량 견적서 PDF 다운로드 기능 구현 및 이미지 렌더링 버그 해결. react-pdf가 새 컴포넌트 생성 시 외부 S3 이미지를 불러오지 못하는 문제를, PDF 생성 전 base64 변환으로 해결.",
          tech: ["Next.js", "react-pdf", "FileReader API", "Base64", "AWS S3"],
          detailLink: "/projects/karoom-pdf",
        },
        {
          title: "정기 결제 시스템 구축",
          description:
            "KG 이니시스 연동 30일 자동 정기 결제 시스템. 결제 도메인 DB 설계, 빌링키 방식 자동결제, B2B 멀티테넌트(CP별 데이터 격리) 구조 구현.",
          tech: ["PHP Laravel", "KG 이니시스", "MySQL", "Cron Scheduler", "Billing Key"],
          detailLink: "/projects/payment-system",
        },
        {
          title: "Google Sheets 기반 i18n 자동화",
          description:
            "Google 스프레드시트에서 번역을 관리하며 i18n 파일을 자동 생성. 서비스 계정 인증, 점 표기 Key의 중첩 객체 deep merge, :param → {param} 변환, 언어별 파일 자동 생성을 처리하는 재사용 모듈(I18nBuilderFromSheets) 개발.",
          tech: ["Google Sheets API", "Node.js", "Vue CLI", "PHP Laravel", "lodash"],
          detailLink: "/projects/google-i18n",
        },
        {
          title: "카테고리 트리 렌더링 성능 개선",
          description:
            "카테고리 약 25,000개·최대 5depth 고객 접속 시 브라우저가 멈추던 장애 해결. flat 데이터의 fullName 가공을 O(N²) → O(N)(level 정렬 + Map 조회)으로 개선하고, vue-virtual-scroll-list와 depth별 캐스케이딩 셀렉터로 렌더링 과부하를 제거.",
          tech: ["Vue", "vue-virtual-scroll-list", "Algorithm Optimization", "JavaScript"],
          detailLink: "/projects/category-tree",
        },
        {
          title: "Docker 런타임 환경변수 주입",
          description:
            "프론트를 독립 SPA로 분리하면서 빌드 시 환경변수가 리터럴로 박혀 환경마다 이미지를 따로 빌드해야 했던 문제 해결. jvjr-docker-env로 $VAR 플레이스홀더로 한 번만 빌드하고, 컨테이너 기동 시 entrypoint가 실제 값으로 치환 — 단일 이미지로 dev/stage/prod 배포.",
          tech: ["Docker", "Nginx", "Vue", "jvjr-docker-env", "CI/CD"],
          detailLink: "/projects/docker-env",
        },
        {
          title: "파일 라이브 편성 UI 고도화",
          description:
            "기획자·디자이너와 협업해 파일 라이브 편성 UI를 고도화한, 직접 리드한 장기 사이드 프로젝트. 요구사항을 앞단에서 명확히 잡고 dev 서버로 주차별 진행을 공유·빠르게 피드백받아 기한 내 안전하게 마감. 드래그앤드롭 편성, 채널별 색상 구분 등 편의성 개선.",
          tech: ["Vue", "fullcalendar.js", "dragula", "프로젝트 리드"],
          detailLink: "/projects/file-live",
        },
        {
          title: "GitOps CI/CD 파이프라인 구축",
          description:
            "rancher→k8s/ArgoCD 이전에 맞춰 GitHub Actions 자동 배포 구축. release 브랜치 push 시 이미지 빌드·푸시 → GitOps 레포 Helm values 갱신 → ArgoCD 배포. 태그가 같은 재배포를 ArgoCD가 감지 못하던 문제를, 배포마다 build_number를 랜덤 갱신해 해결.",
          tech: ["GitHub Actions", "Docker", "Kubernetes", "ArgoCD", "Helm"],
          detailLink: "/projects/cicd",
        },
        {
          title: "nginx + Lua 분산 캐시 서버",
          description:
            "FUSE filesystem 기반 분산 캐시 서버를 nginx + Lua로 재구현해 k8s에 적합하게 전환. Lua가 HTTP Range로 10MB 블록을 계산하고 캐시 노드를 선택(동적 업스트림), nginx slice module이 블록을 가져와 proxy_cache가 블록별로 캐시 — 물리 파일시스템 의존을 제거.",
          tech: ["Nginx", "Lua / OpenResty", "proxy_cache", "slice module", "Kubernetes"],
          detailLink: "/projects/nginx-cache",
        },
        {
          title: "VOD Console Vue2 → Next.js 마이그레이션",
          description:
            "레거시 Vue2 VOD Console을 Next.js로 전환하는 프로젝트를 리드했습니다. Vue 의존성마다 React 생태계 대체재를 조사하고, Feature-Sliced Design과 pnpm 모노레포로 구조를 재정립했으며 공통 디자인 시스템을 도입했습니다. 더불어 하네스 엔지니어링(Claude Code 플러그인)을 도입·사내 공유해 팀의 업무 방식 변화를 이끌었습니다.",
          tech: ["Next.js", "React", "TypeScript", "FSD", "Monorepo", "Design System", "Zustand"],
          detailLink: "/projects/vod-migration",
        },
      ],
    },
    contact: {
      label: "연락",
      title: "연락하기",
      subtitle: "새로운 기회나 협업 제안은 언제든지 환영합니다.",
      infoTitle: "연락처",
      infoBody:
        "현재 새로운 기회를 탐색 중입니다. 포지션 제안, 프리랜서 문의, 혹은 그냥 인사라도 편하게 연락주세요.",
      namePlaceholder: "홍길동",
      nameLabel: "이름",
      emailLabel: "이메일",
      messageLabel: "메시지",
      messagePlaceholder: "안녕하세요, ...",
      send: "보내기",
      sentTitle: "메시지가 전송되었습니다!",
      sentBody: "빠른 시일 내에 답변드리겠습니다.",
    },
    footer: "© 2026 박재영. Built with Next.js & Tailwind CSS",
  },
} as const;

export type Translations = (typeof translations)[Locale];
