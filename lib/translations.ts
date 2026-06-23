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
      bio: "6+ years of experience across web and mobile development — from PHP-based platforms to React Native apps and blockchain systems. Focused on building reliable products that work end-to-end.",
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
          company: "HappyBridge",
          role: "Research Engineer",
          period: "Sep 2021 — Present",
          description: [
            "Led development of a blockchain platform using quantum encryption with go-ethereum infrastructure",
            "Built REST APIs with PHP Laravel and Node.js-based blockchain wallet generation service",
            "Developed cross-platform mobile app with React Native for blockchain wallet management",
          ],
          tech: ["PHP Laravel", "Node.js", "React Native", "MySQL", "CentOS 8"],
        },
        {
          company: "Karoom",
          role: "Research Engineer",
          period: "Oct 2019 — Aug 2021",
          description: [
            "Developed SSR web platform with Nuxt.js and rebuilt the consumer app with React Native",
            "Built AI-powered car repair cost estimator by integrating TensorFlow image recognition into React Native",
            "Implemented location-based API with data crawling and integrated payment systems for the partner portal",
          ],
          tech: ["React Native", "Vue.js", "Nuxt.js", "Next.js", "Node.js", "PHP Laravel", "TensorFlow"],
        },
        {
          company: "BOBMC",
          role: "Developer",
          period: "Jan 2018 — Apr 2019",
          description: [
            "Designed and optimized CRM database schemas for internal and client-facing systems",
            "Integrated PG (payment gateway) and developed statistical dashboards with chart UIs",
            "Built an automated trading radar frontend and maintained CRM systems",
          ],
          tech: ["PHP CodeIgniter", "MySQL", "MariaDB", "JavaScript", "jQuery"],
        },
        {
          company: "SmartGate",
          role: "IT Support Engineer",
          period: "Jun 2016 — Oct 2017",
          description: [
            "Designed network system architecture for enterprise environments",
            "Established and implemented network security policies using Cisco and Paloalto equipment",
          ],
          tech: ["Cisco Switch", "Cisco Router", "Paloalto Firewall", "Fortinet Firewall"],
        },
      ],
    },
    projects: {
      label: "Projects",
      title: "Featured Work",
      items: [
        {
          title: "Quantum Blockchain Platform",
          description:
            "Blockchain platform leveraging quantum encryption. Set up go-ethereum infrastructure on CentOS, built PHP Laravel REST APIs, developed a Node.js blockchain wallet service, and shipped a React Native mobile wallet app.",
          tech: ["PHP Laravel", "Node.js", "React Native", "MySQL", "CentOS 8"],
          detailLink: null,
        },
        {
          title: "Mimo Beauty Service App",
          description:
            "Full-stack beauty service platform built from scratch. Designed the database schema, developed the Node.js backend, and built the React Native consumer app for booking and managing beauty services.",
          tech: ["Node.js", "React Native", "MySQL"],
          detailLink: null,
        },
        {
          title: "Karoom AI Repair Estimator",
          description:
            "AI-powered car repair cost estimation feature integrated into a React Native app. Implemented a TensorFlow image recognition model to match repair photos against cost estimates automatically.",
          tech: ["React Native", "TensorFlow", "Node.js"],
          detailLink: null,
        },
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
      bio: "웹과 모바일 개발 분야에서 6년+ 경력을 쌓았습니다. PHP 기반 플랫폼부터 React Native 앱, 블록체인 시스템까지 다양한 프로젝트를 경험했습니다.",
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
          company: "해피브릿지",
          role: "개발 연구원",
          period: "2021년 9월 — 재직 중",
          description: [
            "양자 암호화 기반 블록체인 플랫폼 개발 및 go-ethereum 서버 인프라 구축",
            "PHP Laravel REST API 및 Node.js 기반 블록체인 지갑 생성 서비스 개발",
            "블록체인 지갑 관리를 위한 React Native 크로스플랫폼 앱 개발",
          ],
          tech: ["PHP Laravel", "Node.js", "React Native", "MySQL", "CentOS 8"],
        },
        {
          company: "(주)카룸",
          role: "개발팀 연구원",
          period: "2019년 10월 — 2021년 8월",
          description: [
            "Nuxt.js로 플랫폼 SSR 웹 개발 및 React Native 앱 리뉴얼",
            "TensorFlow 이미지 인식을 활용한 자동차 수리 견적 AI 기능 개발",
            "위치기반 API 및 데이터 크롤링, 파트너스 결제 시스템 구축",
          ],
          tech: ["React Native", "Vue.js", "Nuxt.js", "Next.js", "Node.js", "PHP Laravel", "TensorFlow"],
        },
        {
          company: "BOBMC",
          role: "개발 사원",
          period: "2018년 1월 — 2019년 4월",
          description: [
            "내부 및 외부 CRM 시스템 DB 설계 및 최적화",
            "PG 연동 및 통계 그래프 프론트 개발",
            "오토레이더 프로그램 프론트 개발 및 CRM 유지보수",
          ],
          tech: ["PHP CodeIgniter", "MySQL", "MariaDB", "JavaScript", "jQuery"],
        },
        {
          company: "스마트게이트",
          role: "IT 기술지원 사원",
          period: "2016년 6월 — 2017년 10월",
          description: [
            "엔터프라이즈 환경의 네트워크 시스템 설계",
            "Cisco 및 Paloalto 장비를 활용한 네트워크 보안 정책 수립 및 구축",
          ],
          tech: ["Cisco Switch", "Cisco Router", "Paloalto Firewall", "Fortinet Firewall"],
        },
      ],
    },
    projects: {
      label: "프로젝트",
      title: "주요 프로젝트",
      items: [
        {
          title: "양자 암호화 블록체인 플랫폼",
          description:
            "양자 암호화를 활용한 블록체인 플랫폼. CentOS 환경에서 go-ethereum 서버를 구축하고, PHP Laravel REST API와 Node.js 지갑 생성 서비스를 개발했으며, React Native 앱도 함께 제공.",
          tech: ["PHP Laravel", "Node.js", "React Native", "MySQL", "CentOS 8"],
          detailLink: null,
        },
        {
          title: "미모 뷰티 서비스 앱",
          description:
            "뷰티 서비스 플랫폼을 풀스택으로 개발. DB 테이블 설계부터 Node.js 백엔드, React Native 앱까지 전 과정을 담당.",
          tech: ["Node.js", "React Native", "MySQL"],
          detailLink: null,
        },
        {
          title: "카룸 AI 수리 견적 시스템",
          description:
            "React Native 앱에 통합된 AI 기반 자동차 수리 견적 기능. TensorFlow 이미지 인식 모델로 수리 사진을 분석해 자동으로 견적을 산출.",
          tech: ["React Native", "TensorFlow", "Node.js"],
          detailLink: null,
        },
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
