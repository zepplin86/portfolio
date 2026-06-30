"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Layers,
  GitCompareArrows,
  Boxes,
  Wrench,
  Bot,
  Users,
  Check,
  Gauge,
} from "lucide-react";

// ── Part 1: Before / After 아키텍처 ─────────────────────────────────────────
type ArchView = "before" | "after";

const ARCH: Record<
  ArchView,
  { label: string; tone: "rose" | "emerald"; stack: { name: string; note: string }[]; points: string[] }
> = {
  before: {
    label: "Before — Vue2 SPA",
    tone: "rose",
    stack: [
      { name: "Vue2 SPA · Options API", note: "독립 SPA, 단일 거대 패키지" },
      { name: "Vuex", note: "전역 상태 관리" },
      { name: "Vue Router", note: "라우팅" },
      { name: "JavaScript 위주", note: "타입 안정성 부족" },
    ],
    points: [
      "단일 패키지라 구조 경계가 흐려 유지보수가 점점 어려워진다",
      "Vue2 기반이라 최신 생태계·보안 패치 대응이 느리다",
      "타입 안정성과 테스트·문서화 기반이 부족하다",
    ],
  },
  after: {
    label: "After — Next.js · FSD · 모노레포",
    tone: "emerald",
    stack: [
      { name: "Next.js · React · TypeScript", note: "독립 프론트, 타입 안정성" },
      { name: "Feature-Sliced Design", note: "명확한 레이어 경계" },
      { name: "Zustand", note: "가벼운 전역 상태" },
      { name: "pnpm 모노레포 · 디자인 시스템", note: "앱 간 UI 일관성·재사용" },
    ],
    points: [
      "레이어 경계가 명확해 유지보수성이 크게 향상",
      "TypeScript로 타입 안정성·테스트·문서화(Storybook) 기반 마련",
      "항상 최신 안정 버전 유지로 보안 취약점 선제 대응",
    ],
  },
};

// ── Part 2: Vue → React 스택 컨버터 ─────────────────────────────────────────
const STACK_MAP = [
  { from: "Vue 2", to: "React + Next.js", why: "컴포넌트 모델 유지하면서 SSR·생태계·인력 풀 확보" },
  { from: "Vuex", to: "Zustand", why: "보일러플레이트 최소화, 가벼운 전역 상태" },
  { from: "Vue Router", to: "Next.js App Router", why: "파일 기반 라우팅으로 라우트 구조 단순화" },
  { from: "Vue I18n", to: "next-intl", why: "Next.js App Router에 맞는 i18n으로 기존 번역 자산 이전" },
  { from: ".vue SFC", to: "JSX + Tailwind", why: "단일 파일 컴포넌트 → JSX·유틸리티 CSS" },
  { from: "Options API", to: "React Hooks", why: "로직 재사용성과 타입 추론 개선" },
];

// ── Part 3: FSD 레이어 ───────────────────────────────────────────────────────
const FSD_LAYERS = [
  { key: "app", role: "FSD의 pages 레이어 역할. Next.js App Router가 app 디렉토리를 라우팅 기준으로 사용하므로, 페이지·라우트 단위 UI를 이 app 디렉토리에 배치했습니다." },
  { key: "widgets", role: "페이지에 들어가는 복합 UI 블록 (헤더, 사이드바 등)" },
  { key: "features", role: "사용자 행동 단위의 기능 (검색, 필터, 플레이어 컨트롤 등)" },
  { key: "entities", role: "비즈니스 데이터를 표현하는 도메인 단위 (User, Item 등)" },
  { key: "shared", role: "재사용 가능한 공통 모듈 (UI, lib, utils, API, hooks)" },
];

const toneMap = {
  rose: { text: "text-rose-300", border: "border-rose-500/40", bg: "bg-rose-500/10", dot: "bg-rose-400" },
  emerald: { text: "text-emerald-300", border: "border-emerald-500/40", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
};

// ── Part 4: /execute-job 파이프라인 ─────────────────────────────────────────
const JOB_STAGES = [
  {
    stage: "Stage 1 · 계획",
    agent: "job-planner",
    model: "Opus",
    modelTone: "violet" as const,
    desc: "작업 명세를 분석해 관련 소스를 탐색하고, FSD 레이어 순서(shared→entities→features→widgets→app)로 단계별 계획을 작성합니다. 코드는 건드리지 않고 가정·리스크·테스트 스킵 기준만 명시합니다.",
    output: ".claude/local/plans/{요약}.md",
  },
  {
    stage: "Stage 2 · 구현",
    agent: "job-coder",
    model: "Opus",
    modelTone: "violet" as const,
    desc: "계획에 명시된 단계만 순서대로 구현합니다. 계획에 없는 변경은 금지하고, any·하드코딩 URL·index key 등 안티패턴을 차단하며 mutation은 entities 레이어로 모읍니다.",
    output: "src/ (FSD 레이어)",
  },
  {
    stage: "Stage 3 · 테스트",
    agent: "job-tester",
    model: "Haiku",
    modelTone: "amber" as const,
    desc: "구현 내부가 아닌 동작(behavior) 기준으로 성공 조건을 검증합니다. 기존 vitest/jest 관례를 따라 소스 옆에 *.test.ts를 배치합니다.",
    output: "*.test.ts",
  },
];

const modelToneMap = {
  violet: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
};

// 작업 명세서(job spec)의 형식을 보여주는 예시
const JOB_SPEC_EXAMPLE = `# 채널 목록에 상태 필터 추가

## 목표
채널 목록을 상태별(공개/비공개/보관)로 거를 수 있게 한다

## 성공 기준
- 상태 칩 클릭 시 목록이 즉시 필터링된다
- 선택한 상태가 URL 쿼리에 반영되어 새로고침에도 유지된다

## 제약
- 필터 UI는 features 레이어에 구현
- 서버 데이터는 Zustand가 아니라 Query 훅 사용`;

// ── Part 5: 하네스가 만든 새 문제와 해결 ─────────────────────────────────────
const AX_COSTS = [
  {
    key: "토큰 과다",
    problem: "토큰 과다 사용",
    detail: "도구 호출마다 원시 출력이 컨텍스트에 그대로 쌓여, 30분이면 컨텍스트 윈도우의 상당 부분이 소진됩니다.",
    solution: "RTK · caveman · context-mode",
    how: "도구 호출 출력을 중간에서 요약·치환해 압축하는 플러그인 조합. 같은 작업을 훨씬 적은 토큰으로 수행합니다.",
    bar: { before: 315, after: 5.4, unit: "KB", reduce: "98%", label: "context-mode 출력 압축 사례" },
  },
  {
    key: "추적 불가",
    problem: "참조 컨텍스트 추적 불가",
    detail: "프롬프트를 실행하고 나면, 어떤 근거로 그렇게 판단해 이런 결과가 나왔는지 되짚기 어렵습니다.",
    solution: "context-timeline (Hook)",
    how: "여러 자료를 찾던 끝에 context-timeline hook을 도입했습니다. 실행 시 어떤 파일을 봤고 어떤 작업을 거쳤는지 추적할 수 있게 되자 원인을 짚어냈고, 이를 바탕으로 Skill·에이전트의 .md를 다듬어 잘못된 결과가 나오지 않도록 유도했습니다.",
    bar: null,
  },
];

export default function VodMigrationPage() {
  const [arch, setArch] = useState<ArchView>("after");
  const [activeMap, setActiveMap] = useState(0);
  const [activeLayer, setActiveLayer] = useState("features");
  const [activeJob, setActiveJob] = useState(0);
  const [activeCost, setActiveCost] = useState(0);

  const a = ARCH[arch];
  const t = toneMap[a.tone];
  const map = STACK_MAP[activeMap];
  const layer = FSD_LAYERS.find((l) => l.key === activeLayer)!;
  const job = JOB_STAGES[activeJob];
  const cost = AX_COSTS[activeCost];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 px-6 py-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          포트폴리오로 돌아가기
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* ── LEFT: Interactive Demo ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          <div>
            <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Live Demo</p>
            <h2 className="text-2xl font-bold mb-2">VOD Console Vue2 → Next.js 마이그레이션</h2>
            <p className="text-sm text-gray-400">
              아키텍처 전환, 스택 대체, FSD 구조, 마일스톤을 직접 눌러가며 살펴보세요.
            </p>
          </div>

          {/* ── Part 1: Before / After 토글 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <GitCompareArrows size={14} className="text-purple-400" />
              Part 1 — Before / After 아키텍처
            </p>

            <div className="flex items-center gap-2">
              {(["before", "after"] as ArchView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setArch(v)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    arch === v
                      ? `${toneMap[ARCH[v].tone].border} ${toneMap[ARCH[v].tone].bg} ${toneMap[ARCH[v].tone].text}`
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {v === "before" ? "Before · Vue2" : "After · Next.js"}
                </button>
              ))}
            </div>

            <div className={`card border ${t.border} p-5 flex flex-col gap-5 animate-fadeIn`} key={arch}>
              <p className={`text-sm font-semibold ${t.text}`}>{a.label}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 레이어 스택 */}
                <div className="flex flex-col gap-2">
                  {a.stack.map((s) => (
                    <div key={s.name} className="rounded-lg border border-white/10 bg-white/3 px-3 py-2">
                      <p className="text-sm text-gray-200">{s.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{s.note}</p>
                    </div>
                  ))}
                </div>

                {/* 포인트 */}
                <ul className="flex flex-col gap-2.5">
                  {a.points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-gray-400">
                      <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${t.dot}`} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Part 2: 스택 컨버터 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Boxes size={14} className="text-cyan-400" />
              Part 2 — Vue → React 스택 컨버터
            </p>
            <p className="text-xs text-gray-500">전환 시 의존성마다 대체 패키지를 조사했습니다. 항목을 눌러보세요.</p>

            <div className="flex flex-wrap gap-2">
              {STACK_MAP.map((m, i) => (
                <button
                  key={m.from}
                  onClick={() => setActiveMap(i)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    activeMap === i
                      ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                      : "border-white/10 text-gray-400 hover:border-white/25"
                  }`}
                >
                  {m.from}
                </button>
              ))}
            </div>

            <div className="card border border-white/10 p-5 flex flex-col gap-4 animate-fadeIn" key={activeMap}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-mono px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30">
                  {map.from}
                </span>
                <ArrowRight size={16} className="text-gray-500" />
                <span className="text-sm font-mono px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {map.to}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                <span className="text-gray-500">선택 근거 · </span>
                {map.why}
              </p>
            </div>
          </div>

          {/* ── Part 3: FSD 레이어 탐색기 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-purple-400" />
              Part 3 — Feature-Sliced Design 레이어
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              표준 FSD 레이어를 그대로 쓰지 않고 프로젝트에 맞게 조정했습니다. 전역 설정용 <span className="font-mono text-gray-400">app</span> 레이어와
              흐름 조정용 <span className="font-mono text-gray-400">processes</span> 레이어는 현재 구조에 적합하지 않아 제외했고,
              <span className="font-mono text-gray-400"> pages</span> 레이어는 Next.js App Router가 <span className="font-mono text-gray-400">app</span> 디렉토리를
              라우팅에 사용하는 특성에 맞춰 <span className="font-mono text-gray-400">app</span> 디렉토리로 잡았습니다. 레이어를 눌러 역할을 확인하세요.
            </p>

            <div className="flex flex-col gap-1.5">
              {FSD_LAYERS.map((l, i) => (
                <button
                  key={l.key}
                  onClick={() => setActiveLayer(l.key)}
                  style={{ marginLeft: `${i * 14}px` }}
                  className={`text-left px-4 py-2 rounded-lg border font-mono text-sm transition-all ${
                    activeLayer === l.key
                      ? "border-purple-500/60 bg-purple-500/10 text-purple-200"
                      : "border-white/10 text-gray-400 hover:border-white/25"
                  }`}
                >
                  {l.key}/
                </button>
              ))}
            </div>

            <div className="card border border-white/10 p-4 animate-fadeIn" key={activeLayer}>
              <p className="text-sm">
                <span className="font-mono text-purple-300">{layer.key}/</span>
                <span className="text-gray-400"> — {layer.role}</span>
              </p>
            </div>
          </div>

          {/* ── Part 4: /execute-job 파이프라인 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Bot size={14} className="text-purple-400" />
              Part 4 — /execute-job 파이프라인 (하네스 엔지니어링)
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              vod-console 에서 직접 만들어 쓰는 커스텀 스킬. <span className="font-mono text-gray-300">/execute-job &#123;이름&#125;</span> 으로 실행하면
              <span className="text-gray-300"> 작업 명세서</span> 한 장을 받아 <span className="text-gray-300">계획 → 구현 → 테스트</span> 3단계로
              역할별 Subagent에 자동 분배합니다. 단계를 눌러보세요.
            </p>

            {/* 작업 명세서란? */}
            <div className="card border border-white/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                <span className="font-mono text-xs text-gray-400">
                  .claude/local/jobs/&#123;이름&#125;.md — 작업 명세서 (예시)
                </span>
              </div>
              <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{JOB_SPEC_EXAMPLE}</pre>
              <p className="px-4 py-2.5 text-[11px] text-gray-500 border-t border-white/5 leading-relaxed">
                &ldquo;무엇을·왜 만들/고칠지, 성공 기준과 제약&rdquo;을 적은 한 장짜리 명세입니다. 사람이 이 한 장만 쓰면,
                나머지 계획·구현·테스트는 파이프라인이 알아서 진행합니다.
              </p>
            </div>

            {/* 오케스트레이터(/execute-job) → 단계 흐름 */}
            <div className="flex flex-col items-center gap-0">
              {/* 명세서 입력 표시 */}
              <span className="text-[11px] text-gray-500 mb-1.5">
                작업 명세서 <span className="font-mono text-gray-600">(위 .md)</span>
              </span>
              <ArrowDown size={14} className="text-gray-600" />

              {/* 중앙 오케스트레이터 */}
              <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-purple-500/50 bg-purple-500/10 text-center my-1.5">
                <p className="font-mono text-sm text-purple-200">/execute-job</p>
                <p className="text-[11px] text-gray-400 mt-0.5">작업 명세서를 받아 3단계로 분배·관리</p>
              </div>
              <div className="w-px h-4 bg-white/15" />

              {/* 순차 단계 (planner → coder → tester) */}
              <div className="flex items-center gap-2 flex-wrap justify-center text-xs mt-1.5">
                {JOB_STAGES.map((s, i) => (
                  <div key={s.agent} className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveJob(i)}
                      className={`flex flex-col items-center px-3 py-1.5 rounded-lg border font-mono transition-all ${
                        activeJob === i
                          ? "border-purple-500/60 bg-purple-500/10 text-purple-200"
                          : "border-white/10 text-gray-400 hover:border-white/25"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-gray-500">Stage {i + 1}</span>
                      {s.agent}
                    </button>
                    {i < JOB_STAGES.length - 1 && <ArrowRight size={14} className="text-gray-600" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="card border border-white/10 p-5 flex flex-col gap-3 animate-fadeIn" key={activeJob}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold text-purple-200">{job.stage}</p>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${modelToneMap[job.modelTone]}`}>
                  {job.agent} · {job.model}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{job.desc}</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-600">결과물 · </span>
                <span className="font-mono text-emerald-300">{job.output}</span>
              </p>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              * 각 단계는 스킵 가능 — 단순 변경이면 계획을, 문서·설정만이면 구현을, UI·설정 변경이면 테스트를 건너뜁니다. 완료 후
              수행·스킵 항목(이유)과 생성·수정 파일 목록을 보고합니다. 설계·구현은 Opus, 테스트는 Haiku — 단계의 난이도에 맞춰 모델을 배치합니다.
            </p>
          </div>

          {/* ── Part 5: 하네스의 새 문제와 해결 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={14} className="text-cyan-400" />
              Part 5 — 강력해진 만큼 생긴 비용, 그리고 해결
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              하네스로 빨라진 대신 새 비용이 드러났습니다. 두 문제를 눌러 해결 방법을 확인하세요.
            </p>

            <div className="flex items-center gap-2">
              {AX_COSTS.map((c, i) => (
                <button
                  key={c.key}
                  onClick={() => setActiveCost(i)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    activeCost === i
                      ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
                      : "border-white/10 text-gray-400 hover:border-white/25"
                  }`}
                >
                  {c.problem}
                </button>
              ))}
            </div>

            <div className="card border border-white/10 p-5 flex flex-col gap-4 animate-fadeIn" key={activeCost}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-mono px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30">
                  {cost.problem}
                </span>
                <ArrowRight size={16} className="text-gray-500" />
                <span className="text-sm font-mono px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {cost.solution}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{cost.detail}</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                <span className="text-gray-500">해결 · </span>
                {cost.how}
              </p>

              {cost.bar && (
                <div className="rounded-lg border border-white/10 bg-white/3 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{cost.bar.label}</span>
                    <span className="text-xs font-semibold text-emerald-300">▼ {cost.bar.reduce}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-12 shrink-0">before</span>
                      <div className="flex-1 h-4 rounded bg-rose-500/30 border border-rose-500/40" />
                      <span className="text-[10px] font-mono text-rose-300 w-16 text-right">
                        {cost.bar.before}
                        {cost.bar.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-12 shrink-0">after</span>
                      <div className="h-4 rounded bg-emerald-500/50 border border-emerald-500/60" style={{ width: "4%" }} />
                      <div className="flex-1" />
                      <span className="text-[10px] font-mono text-emerald-300 w-16 text-right">
                        {cost.bar.after}
                        {cost.bar.unit}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!cost.bar && (
                <div className="rounded-lg border border-white/10 bg-white/3 p-4">
                  <div className="flex items-center justify-between gap-1">
                    {["파일 읽기", "grep 탐색", "결정", "구현"].map((node, i, arr) => (
                      <div key={node} className="flex items-center gap-1 flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-[9px] text-gray-500 whitespace-nowrap">{node}</span>
                        </div>
                        {i < arr.length - 1 && <span className="flex-1 h-px bg-cyan-500/30" />}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-3">
                    * Hook이 참조 시점을 수집 → 타임라인으로 복기 ·{" "}
                    <a
                      href="https://www.aitmpl.com/component/hook/monitoring/context-timeline"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                    >
                      context-timeline ↗
                    </a>
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              * 역할별 Subagent로 모델을 배치하는 것(좌측 Part 4)도 토큰 절약의 한 축입니다.
            </p>
          </div>
        </div>

        {/* ── RIGHT: Description ───────────────────────────────────────── */}
        <aside className="lg:w-96 shrink-0">
          <div className="sticky top-8 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Project</p>
              <h1 className="text-3xl font-bold gradient-text leading-tight">
                VOD Console
                <br />
                Vue2 → Next.js
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Catenoid · 프로젝트 리드</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                React 마이그레이션을 <span className="text-gray-300">AX Engineering</span>으로 확장한 프로젝트
              </p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">
              <Section title="핵심 결론">
                <strong className="text-gray-200">Vue2 → Next.js 마이그레이션을 계기로, 팀의 AX(AI Experience) Engineering 체계를 직접
                설계·정착</strong>시켰습니다. 마이그레이션 자체는 FSD·모노레포·디자인 시스템으로 구조를 다시 세웠고, 그 전환 작업을
                Claude Code <strong className="text-gray-200">하네스로 자동화·표준화</strong>해 개인의 속도가 아니라{" "}
                <strong className="text-gray-200">팀 전체의 생산성</strong>으로 확장했습니다.
              </Section>

              <Section title="배경">
                콘솔은 이미 독립 SPA로 분리돼 있었지만 Vue2 기반 단일 패키지여서, 기능이 늘수록 구조 경계가
                흐려지고 유지보수 비용이 커지고 있었습니다. 여기에 타입 안정성·테스트 기반이 부족했고, 무엇보다{" "}
                <strong className="text-gray-200">Vue2가 공식 EOL(지원 종료)</strong>에 도달해 보안·생태계 측면에서
                더는 머무를 수 없었습니다. 옮기는 김에 상태관리·데이터 패칭을 더 나은 패턴으로 다시 쓰기로 했습니다.
              </Section>

              <Section title="마이그레이션 실행">
                <ul className="space-y-2">
                  <Item>Vue→React 스택을 1:1로 조사해 대체 패키지와 선택 근거를 정리(상태·라우팅·i18n)</Item>
                  <Item>Feature-Sliced Design으로 레이어를 분리해 의존 방향과 책임을 명확화</Item>
                  <Item>pnpm 모노레포 + 공통 디자인 시스템으로 앱 간 UI 일관성과 재사용성 확보</Item>
                  <Item>Jest·Storybook·Playwright로 테스트·문서화 기반 마련</Item>
                </ul>
              </Section>

              <Section title="유지보수에 각별히" icon={<Wrench size={13} className="text-amber-300" />}>
                전환의 목적은 &ldquo;돌아가는 코드&rdquo;가 아니라 <strong className="text-gray-200">오래 살아남는 코드</strong>였습니다.
                레이어 경계와 명명 규칙을 일관되게 잡고, 의존 방향을 단방향으로 강제해 변경의 파급 범위를
                예측 가능하게 만들었습니다. 그 결과 기능 추가·수정 시 손대야 할 범위가 명확해졌습니다.
              </Section>

              <Section title="하네스 엔지니어링 도입" icon={<Bot size={13} className="text-cyan-300" />}>
                전환의 반복 작업과 컨벤션을 프롬프트가 아니라 <strong className="text-gray-200">하네스(설정·도구·컨텍스트)</strong>로
                코드화했습니다. 모델을 바꾸는 대신 그 주변 환경을 설계해, 조건이 맞으면 매번 동일하게 동작하는 결정론적
                워크플로를 만들었습니다.
                <ul className="space-y-2 mt-3">
                  <Item>비대해진 CLAUDE.md(약 200줄 한계)를 부분 .md로 분리하고, 반복 흐름은 Skill로 캡슐화</Item>
                  <Item>Hook으로 저장 시 자동 포맷·린트, 위험 명령 차단, Vue 잔존 코드(.vue·Vue.*) 감지, 종료 시 타입 체크를 강제</Item>
                  <Item>Plan mode와 역할별 Subagent(설계·구현 Opus·테스트 Haiku)로 단계를 분리해 변경을 사전 검증</Item>
                  <Item>대표적으로 작업 파일을 계획→구현→테스트로 자동 분배하는 /execute-job 파이프라인 구축(좌측 데모)</Item>
                  <Item>이 도구들을 사내 플러그인·MCP로 만들어 git 주소로 바로 설치·공유</Item>
                </ul>
              </Section>

              <Section title="새로운 문제와 해결" icon={<Gauge size={13} className="text-cyan-300" />}>
                하네스로 빨라진 만큼 새 비용도 드러났고, 이를 다시 도구로 해결했습니다.
                <ul className="space-y-2 mt-3">
                  <Item>
                    <strong className="text-gray-200">토큰 과다</strong> — 도구 호출 출력이 컨텍스트에 그대로 쌓이는 문제를
                    RTK·caveman·context-mode 플러그인 조합으로 압축 (사례: 출력 315KB→5.4KB, 98% 감소)
                  </Item>
                  <Item>
                    <strong className="text-gray-200">컨텍스트 추적 불가</strong> — 실행 후 판단 근거를 되짚기 어려운 문제를{" "}
                    <a
                      href="https://www.aitmpl.com/component/hook/monitoring/context-timeline"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                    >
                      context-timeline(Hook) ↗
                    </a>
                    으로 추적해 원인을 짚고, Skill·에이전트 .md를 다듬어 재발 방지
                  </Item>
                </ul>
              </Section>

              <Section title="AX Engineering으로의 전환" icon={<Users size={13} className="text-purple-300" />}>
                단독 자동화가 아니라 <strong className="text-gray-200">AI를 &lsquo;다듬어 쓰는&rsquo;</strong> 방향으로 팀의 업무 스타일
                변화를 유도했습니다. 빠르게 진화하는 <strong className="text-gray-200">AX(AI Experience) Engineering</strong> 흐름에
                맞춰, 많은 기업이 도입 중인 AX Engineer 역할처럼 하네스를 설계·공유하는 역량을 팀 내에 키웠고, 이 과정을
                사내 Tech Talk으로 발표해 공유했습니다.
              </Section>

              <Section title="결과 / 효과">
                <ul className="space-y-2">
                  <Item>프론트 독립·구조 재정립으로 유지보수성과 배포 효율 향상</Item>
                  <Item>최신 안정 버전 유지로 보안 취약점에 선제 대응</Item>
                  <Item>공유된 하네스·AX 워크플로로 팀 생산성 동반 상승</Item>
                </ul>
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["Next.js", "React", "TypeScript", "FSD", "pnpm Monorepo", "Design System", "Zustand", "Jest", "Storybook", "Playwright", "Claude Code", "Hook", "Subagent", "MCP"].map(
                    (tag) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 list-none">
      <Check size={14} className="text-cyan-500 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}
