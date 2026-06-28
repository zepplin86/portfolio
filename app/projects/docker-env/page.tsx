"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Boxes, Package, Play, Terminal, Code2, ChevronDown, FileCode, Layers, ArrowRight } from "lucide-react";

// ── 환경별 값 세트 ──────────────────────────────────────────────────────────
type EnvName = "dev" | "stage" | "production";

interface EnvVars {
  VUE_APP_WEB_SERVICE: string;
  VUE_APP_CDN: string;
  VUE_APP_ENV: string;
}

const ENVS: { name: EnvName; label: string; color: string; vars: EnvVars }[] = [
  {
    name: "dev",
    label: "dev",
    color: "cyan",
    vars: {
      VUE_APP_WEB_SERVICE: "https://api.dev.kollus.com",
      VUE_APP_CDN: "https://cdn-dev.kollus.com",
      VUE_APP_ENV: "development",
    },
  },
  {
    name: "stage",
    label: "stage",
    color: "amber",
    vars: {
      VUE_APP_WEB_SERVICE: "https://api.stage.kollus.com",
      VUE_APP_CDN: "https://cdn-stage.kollus.com",
      VUE_APP_ENV: "staging",
    },
  },
  {
    name: "production",
    label: "production",
    color: "emerald",
    vars: {
      VUE_APP_WEB_SERVICE: "https://api.kollus.com",
      VUE_APP_CDN: "https://cdn.kollus.com",
      VUE_APP_ENV: "production",
    },
  },
];

// jvjr-env.json — 빌드 산출물(환경 무관, 단일 이미지). 값이 아닌 $VAR 참조를 담는다.
const JVJR_ENV_JSON = `{
  "WEB_SERVICE": "$VUE_APP_WEB_SERVICE",
  "CDN": "$VUE_APP_CDN",
  "ENV": "$VUE_APP_ENV"
}`;

// 빌드된 번들 스니펫(토큰이 박힌 상태). 이미지 해시는 환경과 무관하게 동일.
const BUILT_BUNDLE = `// app.4f9a1c.js  (빌드 산출물 — 모든 환경 공통)
var ENV = {
  WEB_SERVICE: "$VUE_APP_WEB_SERVICE",
  CDN: "$VUE_APP_CDN",
  ENV: "$VUE_APP_ENV"
};`;

// entrypoint 치환: $VUE_APP_X 토큰을 선택 환경 값으로 바꾼다 (jvjr-entrypoint.sh 재현)
function injectEnv(template: string, vars: EnvVars): string {
  return template.replace(/\$VUE_APP_\w+/g, (token) => {
    const key = token.slice(1) as keyof EnvVars;
    return vars[key] ?? token;
  });
}

const colorMap: Record<string, { text: string; border: string; bg: string }> = {
  cyan: { text: "text-cyan-300", border: "border-cyan-500/60", bg: "bg-cyan-500/10" },
  amber: { text: "text-amber-300", border: "border-amber-500/60", bg: "bg-amber-500/10" },
  emerald: { text: "text-emerald-300", border: "border-emerald-500/60", bg: "bg-emerald-500/10" },
};

// ── 실제 설정 코드 (포트폴리오 첨부용) ───────────────────────────────────────
const CODE_ENV = `# .env  (Vue CLI 환경변수)
VUE_APP_WEB_SERVICE=https://api.kollus.com
VUE_APP_CDN=https://cdn.kollus.com
VUE_APP_ENV=production`;

const CODE_JSON = `// jvjr-env.json  (빌드 시 .env 로부터 생성 — 값이 아닌 참조를 저장)
{
  "WEB_SERVICE": "$VUE_APP_WEB_SERVICE",
  "CDN": "$VUE_APP_CDN",
  "ENV": "$VUE_APP_ENV"
}`;

const CODE_DOCKERFILE = `# Dockerfile  (런타임 치환 entrypoint)
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY jvjr-entrypoint.sh /jvjr-entrypoint.sh
COPY jvjr-env.json /usr/share/nginx/html/jvjr-env.json
RUN chmod +x /jvjr-entrypoint.sh

# 컨테이너 기동 시 dist 의 JS 에서 $VAR 토큰을 실제 env 로 치환 후 nginx 기동
ENTRYPOINT ["/jvjr-entrypoint.sh", "/usr/share/nginx/html/js", "app"]`;

const CODE_USAGE = `// 앱에서 주입된 값 읽기
import EnvProvider from 'jvjr-docker-env';

const api = EnvProvider.value('WEB_SERVICE'); // https://api.kollus.com

// 배포: 동일 이미지에 환경변수만 바꿔 컨테이너 기동
// docker run -e VUE_APP_WEB_SERVICE=https://api.stage.kollus.com  myapp:latest`;

// ── Main Page ─────────────────────────────────────────────────────────────
export default function DockerEnvPage() {
  const [selectedEnv, setSelectedEnv] = useState<EnvName>("dev");
  const [booting, setBooting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [injected, setInjected] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const env = ENVS.find((e) => e.name === selectedEnv)!;

  const runContainer = useCallback(async () => {
    setBooting(true);
    setInjected(false);
    setLogs([]);

    const steps = [
      `$ docker run -e VUE_APP_ENV=${env.vars.VUE_APP_ENV} ... myapp:4f9a1c`,
      "컨테이너 기동 → /jvjr-entrypoint.sh 실행",
      "환경변수 로드 (컨테이너에 주입된 -e 값)",
      "/usr/share/nginx/html/js 스캔 → $VUE_APP_* 토큰 탐색",
      "토큰을 런타임 환경변수 값으로 치환",
      "nginx 기동 — 정적 파일 서빙 시작",
    ];

    for (let i = 0; i < steps.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 260));
      setLogs((prev) => [...prev, steps[i]]);
    }
    await new Promise((r) => setTimeout(r, 200));
    setBooting(false);
    setInjected(true);
  }, [env]);

  const selectEnv = (name: EnvName) => {
    setSelectedEnv(name);
    setInjected(false);
    setLogs([]);
  };

  const runtimeJson = injectEnv(JVJR_ENV_JSON, env.vars);

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
            <h2 className="text-2xl font-bold mb-2">빌드 한 번, 환경변수만 갈아끼우기</h2>
            <p className="text-sm text-gray-400">
              하나의 빌드 이미지에 환경변수만 주입해 dev/stage/production에 배포하는 과정을 직접 체험해보세요.
            </p>
          </div>

          {/* ── Part 1: 빌드/배포 모델 비교 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-purple-400" />
              Part 1 — 빌드타임 박제 vs 런타임 주입
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* naive */}
              <div className="card border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-rose-300">기존 · process.env 직접 사용</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  빌드 시점에 값이 <span className="text-rose-300">코드에 그대로 고정</span>되어, 환경마다 새로 빌드해야 합니다.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {["dev", "stage", "prod"].map((e) => (
                    <div key={e} className="flex flex-col items-center gap-1">
                      <Package size={22} className="text-rose-400" />
                      <span className="text-[10px] text-gray-500">{e} 이미지</span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-2 flex gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">이미지 3개</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">빌드 3회</span>
                </div>
              </div>
              {/* jvjr */}
              <div className="card border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-emerald-300">jvjr-docker-env · 런타임 주입</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  플레이스홀더로 <span className="text-emerald-300">한 번만 빌드</span>. 기동 시 값만 주입합니다.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex flex-col items-center gap-1">
                    <Boxes size={22} className="text-emerald-400" />
                    <span className="text-[10px] text-gray-500">단일 이미지</span>
                  </div>
                  <ArrowRight size={14} className="text-gray-600" />
                  <span className="text-[10px] text-gray-500">dev · stage · prod 공용</span>
                </div>
                <div className="mt-auto pt-2 flex gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">이미지 1개</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">빌드 1회</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Part 2: 런타임 주입 시뮬레이터 ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Play size={14} className="text-cyan-400" />
              Part 2 — 런타임 주입 시뮬레이터
            </p>

            {/* 환경 선택 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">배포 환경</span>
              {ENVS.map((e) => {
                const c = colorMap[e.color];
                return (
                  <button
                    key={e.name}
                    onClick={() => selectEnv(e.name)}
                    className={`px-4 py-2 rounded-xl border text-sm font-mono transition-all ${
                      selectedEnv === e.name ? `${c.border} ${c.bg} ${c.text}` : "border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {e.label}
                  </button>
                );
              })}
              <button
                onClick={runContainer}
                disabled={booting}
                className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {booting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    기동 중...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    컨테이너 기동
                  </>
                )}
              </button>
            </div>

            {/* 빌드 산출물 (고정) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card border border-white/5 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                  <Boxes size={13} className="text-gray-400" />
                  <span className="text-xs font-mono text-gray-400">빌드 산출물 (이미지 4f9a1c · 환경 무관)</span>
                </div>
                <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{BUILT_BUNDLE}</pre>
              </div>

              {/* 런타임 결과 */}
              <div className={`card overflow-hidden ${injected ? "border " + colorMap[env.color].border : "border border-white/5"}`}>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                  <Terminal size={13} className={injected ? colorMap[env.color].text : "text-gray-500"} />
                  <span className="text-xs font-mono text-gray-400">
                    런타임 결과 {injected ? `(${env.label} 주입됨)` : "(기동 전)"}
                  </span>
                </div>
                {injected ? (
                  <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre animate-fadeIn">{runtimeJson}</pre>
                ) : (
                  <div className="p-4 text-xs text-gray-600 h-full flex items-center justify-center min-h-[120px]">
                    &ldquo;컨테이너 기동&rdquo;을 누르면 entrypoint가 토큰을 치환합니다
                  </div>
                )}
              </div>
            </div>

            {/* entrypoint 로그 */}
            {logs.length > 0 && (
              <div className="card border border-white/5 bg-black/40 p-4 font-mono text-xs flex flex-col gap-1.5">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 animate-fadeIn">
                    <span className="text-gray-600 shrink-0">{i === 0 ? "" : "›"}</span>
                    <span className={i === 0 ? "text-purple-300" : "text-gray-400"}>{log}</span>
                  </div>
                ))}
                {booting && <span className="text-gray-600 animate-pulse">▌</span>}
              </div>
            )}

            {injected && (
              <p className="text-xs text-emerald-400/90 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-4 py-3 leading-relaxed animate-fadeIn">
                ✅ 빌드 산출물(왼쪽)은 그대로인데 런타임 값만 <strong>{env.label}</strong>으로 바뀌었습니다.{" "}
                <code className="text-emerald-300">EnvProvider.value(&apos;WEB_SERVICE&apos;)</code> →{" "}
                <code className="text-emerald-300">{env.vars.VUE_APP_WEB_SERVICE}</code>. 환경을 바꿔 다시 기동해보세요.
              </p>
            )}
          </div>

          {/* ── Part 3: 실제 설정 코드 ── */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCode((v) => !v)}
              className="flex items-center justify-between w-full card border border-white/5 px-4 py-3 hover:border-white/15 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Code2 size={14} className="text-cyan-400" />
                실제 설정 코드 — .env · jvjr-env.json · Dockerfile
              </span>
              <ChevronDown size={16} className={`text-gray-500 transition-transform ${showCode ? "rotate-180" : ""}`} />
            </button>

            {showCode && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <CodeBlock file=".env" code={CODE_ENV} />
                <CodeBlock file="jvjr-env.json" code={CODE_JSON} />
                <CodeBlock file="Dockerfile" code={CODE_DOCKERFILE} />
                <CodeBlock file="app — EnvProvider 사용" code={CODE_USAGE} />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Description ───────────────────────────────────────── */}
        <aside className="lg:w-[420px] shrink-0">
          <div className="sticky top-8 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Project</p>
              <h1 className="text-3xl font-bold gradient-text leading-tight">
                프론트 분리 후<br />런타임 환경변수
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Catenoid · VOD Console</p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">

              <Section title="핵심 결론">
                <strong className="text-gray-200">하나의 빌드 이미지로 dev/stage/production을 모두 배포</strong>할 수 있게 만들었습니다.
                <code className="text-purple-300 bg-purple-900/30 px-1 rounded mx-1">jvjr-docker-env</code>로 빌드 시엔 값 대신
                <code className="text-purple-300 bg-purple-900/30 px-1 rounded mx-1">$VAR</code> 플레이스홀더로 빌드하고, 컨테이너가 기동될 때 entrypoint가 실제 환경변수 값으로 치환합니다.
                환경마다 이미지를 따로 빌드하던 비효율을 없앴습니다.
              </Section>

              <Section title="무엇이 문제였나">
                입사 초기 프론트는 PHP/Laravel Mix에 결합돼 있어 환경변수를 PHP Blade로 초기 로딩 시 내려줬습니다.
                그런데 프론트를 <strong className="text-gray-200">독립 SPA로 분리</strong>하면서 그 수단이 사라졌습니다.
                SPA 빌드 산출물은 결국 <strong className="text-gray-200">정적 JS 파일</strong>일 뿐 서버가 아니라 &ldquo;런타임 환경변수&rdquo;라는 개념이 없습니다.
                그래서 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">process.env</code>를 그대로 쓰면 production build 시점에 값이 <strong className="text-gray-200">번들 코드에 그대로 고정</strong>되어,
                결국 dev/stage/prod 이미지를 따로 빌드해야 했습니다.
              </Section>

              <Section title="jvjr-docker-env 동작 방식">
                <div className="space-y-3 mt-1">
                  <FlowBlock label="1. 빌드 타임" color="cyan">
                    <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">.env</code>로부터 <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">jvjr-env.json</code>을 생성하는데,
                    값이 아니라 <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">$VUE_APP_WEB_SERVICE</code> 같은 <strong className="text-gray-300">참조(플레이스홀더)</strong>를 저장합니다.
                  </FlowBlock>
                  <FlowBlock label="2. 단일 이미지" color="cyan">
                    플레이스홀더가 박힌 dist와 <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">jvjr-entrypoint.sh</code>를 하나의 이미지에 담습니다. 환경과 무관한 동일 이미지입니다.
                  </FlowBlock>
                  <FlowBlock label="3. 컨테이너 기동" color="emerald">
                    <code className="text-emerald-300 bg-emerald-900/30 px-1 rounded">ENTRYPOINT</code>로 지정된 스크립트가 dist의 컴파일된 JS를 스캔해
                    <code className="text-emerald-300 bg-emerald-900/30 px-1 rounded mx-1">$VAR</code> 토큰을 <strong className="text-gray-300">런타임에 주입된 환경변수</strong>(<code className="text-emerald-300 bg-emerald-900/30 px-1 rounded">docker run -e</code>) 값으로 치환한 뒤 nginx를 기동합니다.
                  </FlowBlock>
                  <FlowBlock label="4. 런타임" color="emerald">
                    앱은 <code className="text-emerald-300 bg-emerald-900/30 px-1 rounded">EnvProvider.value(&apos;WEB_SERVICE&apos;)</code>로 주입된 값을 읽습니다. 코드는 그대로, 값만 환경별로 달라집니다.
                  </FlowBlock>
                </div>
              </Section>

              <Section title="원인 해결 — 무엇을 바꿨나">
                핵심은 <strong className="text-gray-200">build-time과 run-time의 경계를 분리</strong>한 것입니다. 값을 빌드에 박는 대신 &ldquo;빈자리&rdquo;만 빌드해두고,
                값 주입을 컨테이너가 뜨는 순간으로 미뤘습니다. 덕분에 <strong className="text-gray-200">1 build → N deploy</strong>가 되어
                CI/CD에서 환경별 재빌드가 사라졌고, <strong className="text-gray-200">테스트한 그 이미지가 그대로 운영에 올라가</strong> 환경 간 빌드 차이로 생기는 리스크도 제거됐습니다.
              </Section>

              <Section title="결과 / 효과">
                빌드·배포 파이프라인이 단순해지고 이미지 저장·관리 비용이 줄었습니다. 환경변수 변경도 재빌드 없이
                <strong className="text-gray-200"> 컨테이너 재기동만으로 즉시 반영</strong>됩니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["Docker", "Nginx", "Vue / SPA", "jvjr-docker-env", "CI/CD", "Shell (entrypoint)"].map((t) => (
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

// ── Helpers ─────────────────────────────────────────────────────────────────
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

function CodeBlock({ file, code }: { file: string; code: string }) {
  return (
    <div className="card border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
        <FileCode size={13} className="text-cyan-400" />
        <span className="text-xs font-mono text-gray-400">{file}</span>
      </div>
      <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}
