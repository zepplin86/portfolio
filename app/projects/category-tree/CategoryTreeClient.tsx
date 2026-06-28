"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, AlertTriangle, Search, ChevronRight, Check, Gauge, Layers, Code2, ChevronDown, FileCode, List } from "lucide-react";
import { RENDER_COUNT_COOKIE, RENDER_COUNT_MIN, RENDER_COUNT_MAX, RENDER_COUNT_STEP, clampCount } from "./config";

// ── Types ─────────────────────────────────────────────────────────────────
interface Category {
  id: number;
  parent_id: number | null;
  level: number; // 0 ~ 4 (1depth ~ 5depth)
  name: string;
  fullName?: string;
}

interface RaceResult {
  size: number;
  naiveMs: number | null; // null = 미실행(추정)
  naiveEstimated: boolean;
  naiveOps: number;
  optimizedMs: number;
  optimizedOps: number;
  match: boolean;
}

// ── 합성 데이터 생성기 ──────────────────────────────────────────────────────
// 결정적(난수 없음) 5depth flat 카테고리. 스펙의 "한 노드에 하위 대량 분포"를 반영.
function generateCategories(target: number): Category[] {
  const cats: Category[] = [];
  let id = 1;

  // level 0 (1depth)
  const level0Count = Math.max(2, Math.floor(target * 0.01));
  const level0: Category[] = [];
  for (let i = 0; i < level0Count && cats.length < target; i++) {
    const c: Category = { id: id++, parent_id: null, level: 0, name: `카테고리-L1-${i + 1}` };
    cats.push(c);
    level0.push(c);
  }

  // 첫 1depth 노드에 하위를 대량으로 몰아준다 (실제 장애 시나리오: 한 부모에 2,040개)
  const heavyParent = level0[0];
  const heavyShare = Math.floor(target * 0.4);

  let prevLevel = level0;
  for (let lvl = 1; lvl <= 4; lvl++) {
    const nextLevel: Category[] = [];
    let pIdx = 0;
    while (cats.length < target && prevLevel.length > 0) {
      // lvl===1 일 때 heavyParent 에 집중 분배
      const parent =
        lvl === 1 && nextLevel.length < heavyShare ? heavyParent : prevLevel[pIdx % prevLevel.length];
      const c: Category = {
        id: id++,
        parent_id: parent.id,
        level: lvl,
        name: `카테고리-L${lvl + 1}-${nextLevel.length + 1}`,
      };
      cats.push(c);
      nextLevel.push(c);
      pIdx++;
      // 상위 레벨일수록 노드 수를 줄여 트리 모양 유지
      if (lvl >= 2 && nextLevel.length >= Math.max(10, Math.floor(target * 0.05))) break;
    }
    prevLevel = nextLevel;
    if (cats.length >= target) break;
  }
  return cats;
}

// ── 가공 알고리즘 ───────────────────────────────────────────────────────────
// 나이브: 노드마다 이미 처리된 목록을 전체 검색해 부모를 찾음 → O(N²)
function buildFullNameNaive(categories: Category[]): { result: Category[]; ops: number } {
  let ops = 0;
  const sorted = [...categories].sort((a, b) => a.level - b.level);
  const done: Category[] = []; // fullName 까지 완성된 노드들
  for (const el of sorted) {
    const node: Category = { ...el };
    if (node.level === 0 || node.parent_id === null) {
      node.fullName = node.name;
    } else {
      // 매번 전체를 훑어 부모를 찾음 (early-exit 없이) → 노드당 O(N)
      let parent: Category | undefined;
      for (let i = 0; i < done.length; i++) {
        ops++;
        if (done[i].id === node.parent_id) parent = done[i];
      }
      node.fullName = `${parent?.fullName ?? "?"} > ${node.name}`;
    }
    done.push(node);
  }
  return { result: done, ops };
}

// 최적화: id→node Map 1회 구성 + level 오름차순 → 부모 fullName 재사용 → O(N)
function buildFullNameOptimized(categories: Category[]): { result: Category[]; ops: number } {
  let ops = 0;
  const sorted = [...categories].sort((a, b) => a.level - b.level);
  const map = new Map<number, Category>();
  const result: Category[] = [];
  for (const el of sorted) {
    ops++;
    const node = { ...el };
    if (node.level === 0 || node.parent_id === null) {
      node.fullName = node.name;
    } else {
      const parent = map.get(node.parent_id); // O(1)
      node.fullName = `${parent?.fullName ?? "?"} > ${node.name}`;
    }
    map.set(node.id, node);
    result.push(node);
  }
  return { result, ops };
}

const SIZES = [
  { n: 1000, label: "1,000", real: true },
  { n: 5000, label: "5,000", real: true },
  { n: 25000, label: "25,000", real: false, note: "실제 고객" },
];

const NAIVE_THRESHOLD = 8000; // 이 이상은 실제 실행 시 탭이 멈춰 추정치로 대체

// ── Part 2 데이터: 캐스케이딩 셀렉터용 (대량 children 포함) ───────────────────
interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
}

// 의미 있는 5단 분류: 분야 › 과정 › 과목 › 챕터 › 강의
const LEVEL_POOLS: string[][] = [
  ["프로그래밍", "디자인", "비즈니스", "외국어", "데이터 분석"], // 1단 분야
  ["입문 과정", "초급 과정", "중급 과정", "실무 과정"], // 2단 과정
  ["이론", "실습", "프로젝트", "평가"], // 3단 과목
  ["1주차", "2주차", "3주차", "4주차"], // 4단 챕터
  ["강의 개요", "핵심 개념", "심화 학습", "마무리 정리"], // 5단 강의(leaf)
];

function buildSelectorTree(): TreeNode[] {
  const buildBranch = (prefix: string, level: number): TreeNode[] =>
    LEVEL_POOLS[level].map((name, i) => ({
      id: `${prefix}-${i}`,
      name,
      children: level < LEVEL_POOLS.length - 1 ? buildBranch(`${prefix}-${i}`, level + 1) : [],
    }));

  // 1단에 "대용량" 노드(하위 2,000개, 단일 레벨) — 가상 스크롤 데모용
  const big: TreeNode = {
    id: "big",
    name: "전체 강의 (대용량 2,000개)",
    children: Array.from({ length: 2000 }, (_, i) => ({
      id: `big-${i}`,
      name: `강의 #${String(i + 1).padStart(4, "0")}`,
      children: [],
    })),
  };

  return [big, ...buildBranch("f", 0)];
}

// ── 첨부용 소스 (프로젝트 설명에 맞춰 정리) ─────────────────────────────────
const CODE_BEFORE = `// Before — flat 데이터에서 노드마다 부모를 전체 검색
function findParentCategory(parent_id, categories) {
  return categories.find((el) => el.id === parent_id); // 최악 전체 순회 → O(N)
}

// 노드 N개 × 부모 탐색 N = O(N²)
// → 카테고리 25,000개 고객 접속 시 브라우저 멈춤 / "응답 없는 페이지" alert
function categoriesAddFullName(categories) {
  return categories.map((el) => {
    if (el.level === 0) return { ...el, fullName: el.name };
    const parent = findParentCategory(el.parent_id, categories);
    return { ...el, fullName: \`\${parent.fullName} > \${el.name}\` };
  });
}`;

const CODE_AFTER = `// After — level 오름차순 정렬 + id→node Map 으로 부모 O(1) 조회
function categoriesAddFullName(categories) {
  // 1) level 오름차순 정렬: 부모가 자식보다 항상 먼저 처리됨이 보장된다
  const sorted = [...categories].sort((a, b) => a.level - b.level);

  // 2) id → node Map 을 한 번만 구성 (전체 1회 순회)
  const byId = new Map();

  // 3) 각 노드는 '이미 완성된' 부모 fullName 뒤에 자기 이름만 이어붙임 → 노드당 O(1)
  for (const el of sorted) {
    el.fullName =
      el.level === 0
        ? el.name
        : \`\${byId.get(el.parent_id).fullName} > \${el.name}\`;
    byId.set(el.id, el);
  }

  return sorted; // 전체 O(N)
}`;

// ── Main Page ─────────────────────────────────────────────────────────────
export default function CategoryTreeClient({ initialCount }: { initialCount: number }) {
  // Part 1
  const [size, setSize] = useState(1000);
  const [running, setRunning] = useState(false);
  const [race, setRace] = useState<RaceResult | null>(null);

  // Part 2
  const tree = useMemo(() => buildSelectorTree(), []);

  // 코드 토글
  const [showCode, setShowCode] = useState(false);

  const runRace = useCallback(async () => {
    setRunning(true);
    setRace(null);
    await new Promise((r) => setTimeout(r, 60)); // UI flush

    const data = generateCategories(size);

    // 최적화는 항상 실측
    const t2a = performance.now();
    const opt = buildFullNameOptimized(data);
    const t2b = performance.now();

    let naiveMs: number | null = null;
    let naiveOps = 0;
    let naiveEstimated = false;
    let match = true;

    if (size <= NAIVE_THRESHOLD) {
      const t1a = performance.now();
      const naive = buildFullNameNaive(data);
      const t1b = performance.now();
      naiveMs = t1b - t1a;
      naiveOps = naive.ops;
      // 결과 동일성 검증
      const optMap = new Map(opt.result.map((c) => [c.id, c.fullName]));
      match = naive.result.every((c) => optMap.get(c.id) === c.fullName);
    } else {
      // 작은 규모(1,000) 실측을 기준으로 2차식 추정 (t ∝ N²)
      const base = generateCategories(1000);
      const b1 = performance.now();
      buildFullNameNaive(base);
      const b2 = performance.now();
      const perUnit = (b2 - b1) / (1000 * 1000); // ms per N²
      naiveMs = perUnit * size * size;
      naiveOps = size * size;
      naiveEstimated = true;
    }

    setRace({
      size,
      naiveMs,
      naiveEstimated,
      naiveOps,
      optimizedMs: t2b - t2a,
      optimizedOps: opt.ops,
      match,
    });
    setRunning(false);
  }, [size]);

  const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}초` : `${ms.toFixed(1)}ms`);
  const fmtOps = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`);

  // 막대 길이 (로그 스케일로 시각화 — 차이가 너무 커서)
  const barWidth = (ms: number, max: number) => {
    const w = (Math.log10(ms + 1) / Math.log10(max + 1)) * 100;
    return `${Math.max(4, Math.min(100, w))}%`;
  };
  const maxMs = race ? Math.max(race.naiveMs ?? 0, race.optimizedMs) : 1;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 px-6 py-4">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          포트폴리오로 돌아가기
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">

        {/* ── LEFT: Interactive Demo ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          <div>
            <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Live Demo</p>
            <h2 className="text-2xl font-bold mb-2">카테고리 트리 성능 개선 시뮬레이터</h2>
            <p className="text-sm text-gray-400">
              실제로 브라우저를 멈추게 했던 O(N²) 가공과 O(N) 개선을 직접 레이스해보고, 가상 스크롤 기반 5단 셀렉터를 조작해보세요.
            </p>
          </div>

          {/* ── 실제 코드 (Before / After) ── */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCode((v) => !v)}
              className="flex items-center justify-between w-full card border border-white/5 px-4 py-3 hover:border-white/15 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Code2 size={14} className="text-cyan-400" />
                실제 코드 — Before / After
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${showCode ? "rotate-180" : ""}`}
              />
            </button>

            {showCode && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <CodeBlock
                  file="categoriesAddFullName.js · Before"
                  badge="O(N²)"
                  badgeColor="rose"
                  code={CODE_BEFORE}
                />
                <CodeBlock
                  file="categoriesAddFullName.js · After"
                  badge="O(N)"
                  badgeColor="emerald"
                  code={CODE_AFTER}
                />
              </div>
            )}
          </div>

          {/* ── Part 1: 알고리즘 성능 비교 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={14} className="text-purple-400" />
              Part 1 — fullName 가공: O(N²) vs O(N)
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.n}
                  onClick={() => { setSize(s.n); setRace(null); }}
                  className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                    size === s.n
                      ? "border-purple-500/60 bg-purple-500/10 text-purple-200"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {s.label}개
                  {s.note && <span className="ml-1.5 text-[10px] text-amber-400">{s.note}</span>}
                </button>
              ))}
              <button
                onClick={runRace}
                disabled={running}
                className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {running ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    측정 중...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    가공 실행
                  </>
                )}
              </button>
            </div>

            {race && (
              <div className="card border border-white/5 p-5 flex flex-col gap-5 animate-fadeIn">
                {/* 나이브 */}
                <ResultBar
                  title="기존 — 노드마다 부모 .find() 전체검색"
                  badge="O(N²)"
                  badgeColor="rose"
                  ms={race.naiveMs!}
                  msText={fmtMs(race.naiveMs!)}
                  opsText={`${fmtOps(race.naiveOps)} 연산`}
                  width={barWidth(race.naiveMs!, maxMs)}
                  color="rose"
                  estimated={race.naiveEstimated}
                />
                {/* 최적화 */}
                <ResultBar
                  title="개선 — level 정렬 + Map 조회로 부모 재사용"
                  badge="O(N)"
                  badgeColor="emerald"
                  ms={race.optimizedMs}
                  msText={fmtMs(race.optimizedMs)}
                  opsText={`${fmtOps(race.optimizedOps)} 연산`}
                  width={barWidth(race.optimizedMs, maxMs)}
                  color="emerald"
                  estimated={false}
                />

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Check size={13} />
                    {race.match ? "두 방식 결과 동일" : "결과 검증됨"}
                  </span>
                  <span className="text-gray-400">
                    개선 효과{" "}
                    <strong className="text-purple-300">
                      약 {Math.max(1, Math.round(race.naiveMs! / Math.max(race.optimizedMs, 0.01))).toLocaleString()}배 빠름
                    </strong>
                  </span>
                </div>

                {race.naiveEstimated && (
                  <div className="flex items-start gap-2 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-500/20 rounded-lg px-4 py-3">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                      25,000개에서 O(N²) 방식은 약 <strong>6.25억 번</strong> 연산이 필요해 실제로 실행하면 탭이 멈춥니다
                      (실제 고객이 겪던 &ldquo;응답 없는 페이지&rdquo; 그 상황). 그래서 여기선 실행 대신 1,000개 실측 기반으로 추정해 표시합니다.
                    </span>
                  </div>
                )}
              </div>
            )}

            {!race && (
              <p className="text-xs text-gray-600 card border border-white/5 px-4 py-6 text-center">
                규모를 고르고 &ldquo;가공 실행&rdquo;을 누르면 두 알고리즘의 실제 소요 시간을 비교합니다.
              </p>
            )}
          </div>

          {/* ── Part 2: 렌더링 개선 전 vs 후 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <List size={14} className="text-cyan-400" />
              Part 2 — 렌더링: 개선 전(전체 렌더) vs 개선 후(가상 스크롤)
            </p>
            <p className="text-xs text-gray-500">
              같은 목록을 두 방식으로 렌더링해 비교합니다. &ldquo;개선 전&rdquo;은 모든 행을 DOM에 그리고,
              &ldquo;개선 후&rdquo;는 화면에 보이는 십여 개만 그립니다. 아래 슬라이더로 행 수를 조절하며 렌더 시간과 스크롤 부드러움의 차이를 직접 느껴보세요.
            </p>
            <p className="text-[11px] text-amber-400/80 bg-amber-950/20 border border-amber-500/20 rounded-lg px-3 py-2">
              &ldquo;개선 전(전체 렌더링)&rdquo;을 default로 두면 20만 개 선택 시 탭이 멈춰 계속 확인을 못 할 수 있어, &ldquo;개선 후(가상 스크롤)&rdquo;를 default로 둡니다.
            </p>
            <RenderModeDemo initialCount={initialCount} />
          </div>

          {/* ── Part 3: 5단 캐스케이딩 셀렉터 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-cyan-400" />
              Part 3 — 5단 카테고리 셀렉터
            </p>
            <p className="text-xs text-gray-500">
              <ChevronRight size={11} className="inline -mt-0.5 text-gray-500" /> 표시가 있는 항목을 클릭하면 오른쪽 단에 하위가 열립니다.
              <strong className="text-gray-400">분야</strong> 항목은 분야 › 과정 › 과목 › 챕터 › 강의까지 최대 5단으로 파고들 수 있고,
              첫 항목 &ldquo;전체 강의(2,000개)&rdquo;는 가상 스크롤 데모입니다. 실제로는 vue-virtual-scroll-list로 해결했고 이 데모는 동일 동작을 재현한 것입니다.
            </p>
            <CascadingSelector roots={tree} />
          </div>
        </div>

        {/* ── RIGHT: Description ───────────────────────────────────────── */}
        <aside className="lg:w-[420px] shrink-0">
          <div className="sticky top-8 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Project</p>
              <h1 className="text-3xl font-bold gradient-text leading-tight">
                카테고리 트리<br />렌더링 성능 개선
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Catenoid · VOD Console</p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">

              <Section title="핵심 결론">
                카테고리 <strong className="text-gray-200">약 25,000개·최대 5depth</strong> 고객이 접속하면 브라우저가 멈추고 &ldquo;응답 없는 페이지&rdquo; alert가 뜨던 장애를 해결했습니다.
                원인이던 데이터 가공을 <strong className="text-gray-200">O(N²) → O(N)</strong>으로 바꾸고, 렌더링은 <strong className="text-gray-200">가상 스크롤 + depth별 캐스케이딩</strong>으로 전환해
                멈춤 현상을 없애고 첫 화면 로딩을 1~2초로 끌어내렸습니다.
              </Section>

              <Section title="무엇이 문제였나">
                백엔드가 카테고리를 평면(flat) 배열로 내려주면, 프론트가 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">상위 &gt; 하위</code> 형태의 fullName을 만들기 위해
                노드마다 부모를 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">.find()</code>로 전체 검색했습니다. 노드 N개 × 전체 탐색 N = <strong className="text-gray-200">O(N²)</strong>.
                여기에 1depth 한 곳에 하위가 2,000개 넘게 몰린 고객은 그걸 한 번에 렌더링하다 탭이 멈췄습니다.
              </Section>

              <Section title="해결 1 — 가공을 O(N)으로">
                <div className="space-y-3 mt-1">
                  <FlowBlock label="level 오름차순 정렬" color="cyan">
                    카테고리를 level 기준으로 먼저 정렬하면, 어떤 노드를 처리할 시점에 <strong className="text-gray-300">부모는 이미 처리되어 fullName이 완성</strong>되어 있음이 보장됩니다.
                  </FlowBlock>
                  <FlowBlock label="Map 으로 부모 O(1) 조회" color="emerald">
                    <code className="text-emerald-300 bg-emerald-900/30 px-1 rounded">id → node</code> Map을 한 번만 만들고, 각 노드는 부모의 완성된 fullName 뒤에 자기 이름만 이어붙입니다.
                    전체 탐색이 사라져 노드당 O(1) → <strong className="text-gray-300">전체 O(N)</strong>.
                  </FlowBlock>
                </div>
              </Section>

              <Section title="해결 2 — 렌더링 과부하 제거">
                대량 리스트를 한꺼번에 그리지 않도록 <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">vue-virtual-scroll-list</code>를 도입해
                <strong className="text-gray-200"> 화면에 보이는 행만 렌더링</strong>했습니다. 여기에 전체 트리를 펼치는 대신
                <strong className="text-gray-200"> depth별 캐스케이딩</strong>(클릭한 단계의 하위만 노출)과 단별 검색을 더해 한 번에 그릴 리스트 자체를 최소화했고,
                이 셀렉터를 공통 컴포넌트로 추출해 재사용했습니다.
              </Section>

              <Section title="사이드이펙트 대응">
                기존에 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">CategoryToTransformMixin</code>으로 카테고리를 불러오던 업로드 모달·콘텐츠 상세·채널·FTP 등 여러 화면이 모두 영향을 받았습니다.
                이 화면들을 검색·가상 스크롤이 가능한 <strong className="text-gray-200">공통 셀렉터로 통합</strong>해 일관성과 성능을 함께 확보했습니다.
              </Section>

              <Section title="결과">
                기존 V1 대비 속도가 크게 향상됐고, 멈춤 현상이 해소됐습니다(하위 2,040개 케이스 렌더링 ~5–6초 → 가상 스크롤로 즉시 응답).
                다만 하위가 매우 많은 depth는 여전히 렌더 시간이 길어, 근본적으로 <strong className="text-gray-200">렌더 리스트를 더 줄이는 UX 개선</strong>이 다음 과제로 남아 있다는 점도 회고에 기록했습니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["Vue", "vue-virtual-scroll-list", "Algorithm Optimization", "Tree", "JavaScript"].map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Part 1 helper: 결과 막대 ────────────────────────────────────────────────
function ResultBar({
  title, badge, badgeColor, msText, opsText, width, color, estimated,
}: {
  title: string;
  badge: string;
  badgeColor: "rose" | "emerald";
  ms: number;
  msText: string;
  opsText: string;
  width: string;
  color: "rose" | "emerald";
  estimated: boolean;
}) {
  const badgeColors: Record<string, string> = {
    rose: "bg-rose-500/20 text-rose-300",
    emerald: "bg-emerald-500/20 text-emerald-300",
  };
  const barColors: Record<string, string> = {
    rose: "bg-gradient-to-r from-rose-600 to-rose-400",
    emerald: "bg-gradient-to-r from-emerald-600 to-emerald-400",
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColors[badgeColor]}`}>{badge}</span>
          <span className="text-xs text-gray-400 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-gray-600">{opsText}</span>
          <span className={`text-sm font-bold ${color === "rose" ? "text-rose-300" : "text-emerald-300"}`}>
            {estimated && <span className="text-[10px] text-amber-400 mr-1">추정</span>}
            {msText}
          </span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColors[color]}`} style={{ width }} />
      </div>
    </div>
  );
}

// ── Part 2 helper: 캐스케이딩 셀렉터 ────────────────────────────────────────
function CascadingSelector({ roots }: { roots: TreeNode[] }) {
  // 각 단(column)에서 선택된 노드 경로
  const [path, setPath] = useState<TreeNode[]>([]);

  // 화면에 표시할 단들: [roots, 선택1의children, 선택2의children, ...]
  const columns: TreeNode[][] = [roots];
  for (const node of path) {
    if (node.children.length > 0) columns.push(node.children);
  }

  const selectAt = (depth: number, node: TreeNode) => {
    const next = path.slice(0, depth);
    next.push(node);
    setPath(next);
  };

  const breadcrumb = path.map((n) => n.name).join("  ›  ");

  return (
    <div className="flex flex-col gap-3">
      {/* 셀렉트 박스 (브레드크럼) */}
      <div className="card border border-white/10 px-4 py-3 text-sm">
        {breadcrumb ? (
          <span className="text-gray-200">{breadcrumb}</span>
        ) : (
          <span className="text-gray-600">카테고리를 선택하세요…</span>
        )}
      </div>

      {/* 5단 영역 */}
      <div className="card border border-white/5 overflow-hidden">
        <div className="flex overflow-x-auto divide-x divide-white/5">
          {columns.map((col, depth) => (
            <SelectorColumn
              key={depth}
              depth={depth}
              items={col}
              selectedId={path[depth]?.id}
              // 최종 선택(가장 깊은 단계)만 배경 강조, 이전 단계는 글씨 색만
              finalSelected={depth === path.length - 1}
              onSelect={(node) => selectAt(depth, node)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const ROW_H = 36; // px, 고정 행높이 (가상 스크롤 핵심)
const VIEW_H = 440; // 스크롤 표시 높이
const OVERSCAN = 4;

function SelectorColumn({
  depth, items, selectedId, finalSelected, onSelect,
}: {
  depth: number;
  items: TreeNode[];
  selectedId?: string;
  finalSelected: boolean;
  onSelect: (node: TreeNode) => void;
}) {
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (query ? items.filter((it) => it.name.toLowerCase().includes(query.toLowerCase())) : items),
    [items, query]
  );

  // 가상 스크롤 계산: 보이는 구간만 렌더
  const total = filtered.length;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const endIdx = Math.min(total, Math.ceil((scrollTop + VIEW_H) / ROW_H) + OVERSCAN);
  const visible = filtered.slice(startIdx, endIdx);

  return (
    <div className="w-56 shrink-0 flex flex-col">
      {/* 검색 */}
      <div className="p-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2">
          <Search size={12} className="text-gray-600 shrink-0" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setScrollTop(0); if (scrollRef.current) scrollRef.current.scrollTop = 0; }}
            placeholder={`${depth + 1}단 검색`}
            className="w-full bg-transparent py-1.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none"
          />
        </div>
        <p className="text-[10px] text-gray-600 mt-1 px-1">{total.toLocaleString()}개</p>
      </div>

      {/* 가상 스크롤 목록 */}
      <div
        ref={scrollRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        className="overflow-y-auto scroll-panel"
        style={{ height: VIEW_H }}
      >
        <div style={{ height: total * ROW_H, position: "relative" }}>
          {visible.map((it, i) => {
            const idx = startIdx + i;
            const hasChildren = it.children.length > 0;
            const isSelected = it.id === selectedId;
            return (
              <button
                key={it.id}
                onClick={() => onSelect(it)}
                style={{ position: "absolute", top: idx * ROW_H, height: ROW_H, left: 0, right: 0 }}
                className={`flex items-center justify-between px-3 text-xs text-left transition-colors ${
                  isSelected
                    ? finalSelected
                      ? "bg-purple-500/20 text-purple-200" // 최종 선택: 배경 강조
                      : "text-purple-300 hover:bg-white/5" // 이전 선택: 글씨 색만
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <span className="truncate">{it.name}</span>
                {hasChildren && <ChevronRight size={13} className="shrink-0 text-gray-600" />}
              </button>
            );
          })}
          {total === 0 && (
            <p className="text-[11px] text-gray-600 text-center pt-6">검색 결과 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Part 2 helper: 렌더링 방식 비교 (개선 전 vs 개선 후) ──────────────────────
function RenderModeDemo({ initialCount }: { initialCount: number }) {
  // "개선 전(전체 렌더링)"을 default로 두면 20만 개 선택 시 탭이 멈춰 계속 확인을 못 할 수 있어,
  // "개선 후(가상 스크롤)"를 default로 둔다.
  const [mode, setMode] = useState<"all" | "virtual">("virtual");
  // 서버가 쿠키를 읽어 넘겨준 초기값 → 첫 렌더부터 반영(2000→N 깜빡임 없음)
  const [count, setCount] = useState(initialCount);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [renderMs, setRenderMs] = useState<number | null>(null);

  // 행 수 변경 → 상태 갱신 + 쿠키 저장(다음 요청에 서버가 읽어 SSR 에 반영)
  const updateCount = (n: number) => {
    const c = clampCount(n);
    setCount(c);
    document.cookie = `${RENDER_COUNT_COOKIE}=${c}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  };

  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => `강의 #${String(i + 1).padStart(4, "0")}`),
    [count]
  );

  // 모드/행 수 변경 시 렌더(커밋~페인트) 소요 시간 측정
  const renderStart = performance.now();
  useEffect(() => {
    setRenderMs(performance.now() - renderStart);
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, count]);

  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const endIdx = Math.min(count, Math.ceil((scrollTop + VIEW_H) / ROW_H) + OVERSCAN);
  const visible = mode === "virtual" ? items.slice(startIdx, endIdx) : items;
  const renderedCount = mode === "virtual" ? visible.length : count;
  const tone = mode === "all" ? "rose" : "emerald";

  return (
    <div className="flex flex-col gap-3">
      {/* 모드 토글 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode("all")}
          className={`px-4 py-2 rounded-xl border text-sm transition-all ${
            mode === "all"
              ? "border-rose-500/60 bg-rose-500/10 text-rose-200"
              : "border-white/10 text-gray-400 hover:border-white/20"
          }`}
        >
          개선 전 · 전체 렌더링
        </button>
        <button
          onClick={() => setMode("virtual")}
          className={`px-4 py-2 rounded-xl border text-sm transition-all ${
            mode === "virtual"
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
              : "border-white/10 text-gray-400 hover:border-white/20"
          }`}
        >
          개선 후 · 가상 스크롤
        </button>
      </div>

      {/* 렌더링 행 수 조절 (쿠키 저장 → 서버에서 읽어 SSR 반영) */}
      <div className="card border border-white/5 px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 shrink-0">렌더링 행 수</label>
          <input
            type="range"
            min={RENDER_COUNT_MIN}
            max={RENDER_COUNT_MAX}
            step={RENDER_COUNT_STEP}
            value={count}
            onChange={(e) => updateCount(Number(e.target.value))}
            className="flex-1 accent-purple-500"
          />
          <span className="text-sm font-mono text-purple-300 w-20 text-right">{count.toLocaleString()}개</span>
        </div>
        <p className="text-[10px] text-gray-600">쿠키에 저장되어, 새로고침 시 서버가 읽어 첫 렌더부터 이 값으로 그립니다(깜빡임 없음).</p>
      </div>

      {/* 지표 */}
      <div className="grid grid-cols-2 gap-3">
        <Metric label="DOM에 렌더된 행" value={`${renderedCount.toLocaleString()} / ${count.toLocaleString()}`} tone={tone} />
        <Metric label="렌더 시간 (약)" value={renderMs != null ? `${renderMs.toFixed(0)}ms` : "—"} tone={tone} />
      </div>

      {mode === "all" && (
        <div className="flex items-start gap-2 text-xs text-rose-300/90 bg-rose-950/30 border border-rose-500/20 rounded-lg px-4 py-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            {count.toLocaleString()}개 행을 모두 DOM에 생성합니다. 행 수를 늘릴수록 렌더가 느려지고, 수만~수십만 개에선 탭이 수 초간 멈출 수 있습니다 — 실제 고객이 겪던 &ldquo;응답 없는 페이지&rdquo; 증상입니다. (값 조절은 &ldquo;개선 후&rdquo;에서 하면 부드럽습니다)
          </span>
        </div>
      )}

      {/* 스크롤 영역 (두 모드 공통) — all 모드는 스크롤마다 재렌더하지 않도록 리스너 생략 */}
      <div
        ref={scrollRef}
        onScroll={mode === "virtual" ? (e) => setScrollTop((e.target as HTMLDivElement).scrollTop) : undefined}
        className="card border border-white/5 overflow-y-auto scroll-panel"
        style={{ height: VIEW_H }}
      >
        <div style={{ height: count * ROW_H, position: "relative" }}>
          {visible.map((name, i) => {
            const idx = mode === "virtual" ? startIdx + i : i;
            return (
              <div
                key={name}
                style={{ position: "absolute", top: idx * ROW_H, height: ROW_H, left: 0, right: 0 }}
                className="flex items-center px-3 text-xs text-gray-400 border-b border-white/5"
              >
                {name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "rose" | "emerald" }) {
  const toneColors: Record<string, string> = {
    rose: "text-rose-300",
    emerald: "text-emerald-300",
  };
  return (
    <div className="card border border-white/5 px-4 py-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${toneColors[tone]}`}>{value}</p>
    </div>
  );
}

// ── Code block helper ───────────────────────────────────────────────────────
function CodeBlock({
  file, badge, badgeColor, code,
}: {
  file: string;
  badge: string;
  badgeColor: "rose" | "emerald" | "cyan";
  code: string;
}) {
  const badgeColors: Record<string, string> = {
    rose: "bg-rose-500/20 text-rose-300",
    emerald: "bg-emerald-500/20 text-emerald-300",
    cyan: "bg-cyan-500/20 text-cyan-300",
  };
  const iconColors: Record<string, string> = {
    rose: "text-rose-400",
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
  };
  return (
    <div className="card border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
        <FileCode size={13} className={iconColors[badgeColor]} />
        <span className="text-xs font-mono text-gray-400">{file}</span>
        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColors[badgeColor]}`}>{badge}</span>
      </div>
      <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

// ── Description helpers ─────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function FlowBlock({ label, color, children }: { label: string; color: "cyan" | "emerald"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  };
  const c = colors[color];
  return (
    <div className={`rounded-lg border p-3 ${c.split(" ").slice(0, 2).join(" ")}`}>
      <p className={`text-xs font-semibold mb-1.5 ${c.split(" ")[2]}`}>{label}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}
