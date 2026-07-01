"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Server, HardDrive, Boxes, Play, Code2, ChevronDown, FileCode, RotateCcw } from "lucide-react";

// ── 데모 상수 ───────────────────────────────────────────────────────────────
const BLOCK_MB = 10;
const BLOCK_COUNT = 10; // 100MB 파일
const NODE_COUNT = 6; // 실제 ~70대, 시각화를 위해 축소

// 블록 → 캐시 노드 매핑 (동적 업스트림 재현, 결정적 해시)
const nodeOf = (block: number) => (block * 7 + 3) % NODE_COUNT;
const rangeLabel = (block: number) => `${block * BLOCK_MB}–${(block + 1) * BLOCK_MB}M`;

interface LogLine {
  block: number;
  node: number;
  hit: boolean;
}

// ── 익명화된 nginx 설정 (origin IP 등 치환, $var 만 사용) ─────────────────────
const NGINX_CONF = `# 1) 콘텐츠 인입 — nginx-vod remote 모드
location ~ \\.mp4$ {
    vod_mode remote;
    vod_upstream_location /remote_gateway;
}

location /remote_gateway {
    proxy_pass http://localhost/get_slice_content;
}

# 2) Lua — 들어온 Range 로 블록 계산 + 동적 업스트림(캐시 노드) 선택
location /get_slice_content {
    content_by_lua_block {
        -- 파일 크기 / HTTP Range 로 필요한 10M 블록(slice) 계산
        -- 블록 키로 동적 업스트림(캐시 노드) 선택
        -- lua-resty-http 로 dynamic_upstream/backend_slice_upstream 요청
        -- 응답을 ngx.print 로 클라이언트에 스트리밍
    }
}

# 3) 블록 단위 캐시 — slice module + proxy_cache
location /backend_slice_upstream {
    proxy_pass http://proxy_origin/;
    slice 10m;                                   # 블록 단위로 origin 요청
    proxy_cache slice_cache;
    proxy_cache_key $cache_key_uri$slice_range;  # 블록(slice)별 캐시 키
    proxy_cache_valid 200 206 10h;
    proxy_set_header Range $slice_range;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}

# 4) Origin
upstream proxy_origin {
    server 10.20.0.10;   # origin (예시 IP)
}

location /origin_content {
    root /data/videos;
    try_files $uri =404;
}`;

// ── Main Page ─────────────────────────────────────────────────────────────
export default function NginxCachePage() {
  const [cached, setCached] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [stats, setStats] = useState({ req: 0, hit: 0, miss: 0 });
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [fetching, setFetching] = useState<number | null>(null);
  const [showCode, setShowCode] = useState(false);

  const requestBlock = useCallback(
    async (block: number) => {
      setActiveBlock(block);
      const node = nodeOf(block);
      const isHit = cached.has(block);

      setStats((s) => ({ req: s.req + 1, hit: s.hit + (isHit ? 1 : 0), miss: s.miss + (isHit ? 0 : 1) }));
      setLogs((l) => [{ block, node, hit: isHit }, ...l].slice(0, 8));

      if (!isHit) {
        // MISS → origin fetch 애니메이션 후 캐시 적재
        setFetching(block);
        await new Promise((r) => setTimeout(r, 700));
        setCached((c) => new Set(c).add(block));
        setFetching(null);
      }
      setTimeout(() => setActiveBlock((b) => (b === block ? null : b)), 400);
    },
    [cached]
  );

  const playRange = useCallback(async () => {
    // 임의 시작점부터 연속 3블록 요청 (구간 재생)
    const start = stats.req % (BLOCK_COUNT - 2);
    for (let i = start; i < start + 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      await requestBlock(i);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 180));
    }
  }, [requestBlock, stats.req]);

  const reset = () => {
    setCached(new Set());
    setLogs([]);
    setStats({ req: 0, hit: 0, miss: 0 });
    setActiveBlock(null);
    setFetching(null);
  };

  const hitRate = stats.req > 0 ? Math.round((stats.hit / stats.req) * 100) : 0;

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
            <h2 className="text-2xl font-bold mb-2">블록 분산 캐시 시뮬레이터</h2>
            <p className="text-sm text-gray-400">
              영상의 블록(10MB slice)을 요청하면 Lua가 캐시 노드를 골라 가져옵니다. 처음엔 origin에서 받아 캐시(MISS), 이후엔 노드에서 바로 응답(HIT)합니다.
            </p>
          </div>

          {/* ── Part 1: FUSE vs nginx+Lua ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <HardDrive size={14} className="text-purple-400" />
              Part 1 — 기존(FUSE) vs 신규(nginx + Lua)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col gap-2">
                <p className="text-sm font-semibold text-rose-300">기존 · FUSE filesystem</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  file open 시 커널이 블록 단위로 읽어 약 70대 서버에 분산 캐시. 하지만 <strong className="text-gray-300">물리 서버의 파일시스템</strong>에 의존해
                  <strong className="text-gray-300"> k8s 환경엔 부적합</strong>합니다.
                </p>
                <div className="mt-auto pt-1 flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">커널 레벨</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">물리 FS 의존</span>
                </div>
              </div>
              <div className="card border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-2">
                <p className="text-sm font-semibold text-emerald-300">신규 · nginx + Lua</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  같은 &ldquo;블록 단위 분산 캐시&rdquo; 개념을 <strong className="text-gray-300">proxy_cache + slice module + Lua</strong>로 재구현.
                  파일시스템 없이 <strong className="text-gray-300">컨테이너로 수평 확장</strong>합니다.
                </p>
                <div className="mt-auto pt-1 flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">k8s 친화</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">HTTP 기반</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Part 2: 시뮬레이터 ── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Boxes size={14} className="text-cyan-400" />
                Part 2 — 블록 요청 & 분산 캐시
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={playRange}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                >
                  <Play size={12} />
                  구간 재생
                </button>
                {(stats.req > 0 || cached.size > 0) && (
                  <button onClick={reset} className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
                    <RotateCcw size={12} />
                    초기화
                  </button>
                )}
              </div>
            </div>

            {/* 파일 바 (블록) */}
            <div>
              <p className="text-[11px] text-gray-600 mb-1.5">동영상 파일 100MB · 10MB 블록 (클릭해 요청)</p>
              <div className="flex gap-1">
                {Array.from({ length: BLOCK_COUNT }, (_, b) => {
                  const isCached = cached.has(b);
                  const isFetching = fetching === b;
                  const isActive = activeBlock === b;
                  return (
                    <button
                      key={b}
                      onClick={() => requestBlock(b)}
                      title={`bytes ${rangeLabel(b)} → node ${nodeOf(b)}`}
                      className={`flex-1 h-12 rounded-md border text-[10px] font-mono flex flex-col items-center justify-center transition-all ${
                        isFetching
                          ? "border-amber-500/60 bg-amber-500/20 text-amber-200 animate-pulse"
                          : isCached
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                          : "border-white/10 bg-white/3 text-gray-500 hover:border-white/25"
                      } ${isActive ? "ring-2 ring-cyan-400/50" : ""}`}
                    >
                      <span className="font-bold">{b}</span>
                      <span className="opacity-60">{rangeLabel(b)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 지표 */}
            <div className="grid grid-cols-4 gap-2">
              <Metric label="요청" value={`${stats.req}`} />
              <Metric label="HIT" value={`${stats.hit}`} tone="emerald" />
              <Metric label="MISS" value={`${stats.miss}`} tone="amber" />
              <Metric label="HIT율" value={`${hitRate}%`} tone="cyan" />
            </div>

            {/* 캐시 노드 패널 */}
            <div>
              <p className="text-[11px] text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Server size={12} /> 캐시 노드 {NODE_COUNT}대 (블록이 노드에 분산 저장됨)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({ length: NODE_COUNT }, (_, n) => {
                  const blocks = Array.from(cached).filter((b) => nodeOf(b) === n).sort((a, z) => a - z);
                  return (
                    <div key={n} className="card border border-white/5 p-2.5 flex flex-col gap-1.5">
                      <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                        <Server size={11} className="text-cyan-500/70" /> node {n}
                      </p>
                      <div className="flex flex-wrap gap-1 min-h-[20px]">
                        {blocks.length === 0 ? (
                          <span className="text-[10px] text-gray-700">—</span>
                        ) : (
                          blocks.map((b) => (
                            <span key={b} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              #{b}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 로그 */}
            {logs.length > 0 && (
              <div className="card border border-white/5 bg-black/40 p-3 font-mono text-[11px] flex flex-col gap-1">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 animate-fadeIn">
                    <span className={`px-1.5 rounded text-[10px] font-bold ${log.hit ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {log.hit ? "HIT " : "MISS"}
                    </span>
                    <span className="text-gray-400">
                      slice bytes {rangeLabel(log.block)} → node {log.node}
                      {log.hit ? " (캐시에서 응답)" : " → origin fetch 후 캐시 적재"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Part 3: nginx 설정 ── */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCode((v) => !v)}
              className="flex items-center justify-between w-full card border border-white/5 px-4 py-3 hover:border-white/15 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Code2 size={14} className="text-cyan-400" />
                nginx 설정 — slice + proxy_cache + Lua
              </span>
              <ChevronDown size={16} className={`text-gray-500 transition-transform ${showCode ? "rotate-180" : ""}`} />
            </button>
            {showCode && (
              <div className="animate-fadeIn card border border-white/5 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                  <FileCode size={13} className="text-cyan-400" />
                  <span className="text-xs font-mono text-gray-400">nginx.conf</span>
                  <span className="ml-auto text-[10px] text-gray-600">origin IP 등은 익명화된 예시</span>
                </div>
                <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{NGINX_CONF}</pre>
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
                nginx + Lua<br />블록 분산 캐시 서버
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Catenoid · VOD Console</p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">

              <Section title="핵심 결론">
                기존 <strong className="text-gray-200">FUSE filesystem 기반 분산 캐시 서버를 nginx + Lua로 재구현</strong>해, k8s 환경에 맞는 블록 단위 분산 캐시를 구축했습니다.
                <strong className="text-gray-200"> proxy_cache</strong>(캐싱) · <strong className="text-gray-200">slice module</strong>(블록 단위 fetch) · <strong className="text-gray-200">Lua</strong>(블록 계산·캐시 노드 분배)로 같은 동작을 컨테이너 환경에서 그대로 재현했습니다.
              </Section>

              <Section title="무엇이 문제였나">
                서비스는 CDN 성격을 가져, 기존엔 FUSE filesystem으로 분산 캐시를 운영했습니다. file open 시 커널이 <strong className="text-gray-300">블록 단위로 파일을 읽어 약 70대 서버에 나눠 캐시</strong>하고, 필요한 블록을 지정 서버에서 빠르게 가져오는 방식이었습니다.
                문제는 FUSE가 <strong className="text-gray-300">물리 서버의 파일시스템</strong>을 전제로 한다는 점 — 배포 환경이 k8s로 옮겨가면서 이 방식이 맞지 않아 재개발이 필요했습니다.
              </Section>

              <Section title="구조 — 요청이 흐르는 경로">
                <div className="space-y-3 mt-1">
                  <FlowBlock label="1. 콘텐츠 인입" color="purple">
                    nginx-vod의 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">remote</code> 모드로 영상 요청을 받아 게이트웨이로 전달합니다.
                  </FlowBlock>
                  <FlowBlock label="2. Lua — 블록 계산 & 노드 선택" color="cyan">
                    <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">content_by_lua_block</code>에서 들어온 <strong className="text-gray-300">HTTP Range로 필요한 10MB 블록(slice)</strong>을 계산하고,
                    블록 키로 <strong className="text-gray-300">동적 업스트림(캐시 노드)</strong>을 골라 <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">lua-resty-http</code>로 요청합니다.
                  </FlowBlock>
                  <FlowBlock label="3. 블록 단위 캐시" color="emerald">
                    <code className="text-emerald-300 bg-emerald-900/30 px-1 rounded">slice 10m</code>으로 origin에서 블록 단위로 가져오고,
                    <code className="text-emerald-300 bg-emerald-900/30 px-1 rounded">proxy_cache</code>가 캐시 키에 <code className="text-emerald-300 bg-emerald-900/30 px-1 rounded">slice_range</code>를 포함해 <strong className="text-gray-300">블록별로 캐시</strong>합니다.
                  </FlowBlock>
                </div>
              </Section>

              <Section title="해결 — 무엇을 바꿨나">
                커널 파일시스템에 의존하던 &ldquo;블록 분산 캐시&rdquo;를, <strong className="text-gray-200">표준 HTTP 계층(slice + proxy_cache)과 Lua 로직</strong>으로 옮겼습니다.
                물리 파일시스템 의존이 사라져 <strong className="text-gray-200">k8s에서 캐시 노드를 수평 확장</strong>할 수 있고, 운영 인프라를 컨테이너로 통일했습니다.
              </Section>

              <Section title="안정성 검증 — 실 트래픽 리플레이">
                새 캐시 서버가 실제 트래픽에서도 문제없이 동작하는지 확인하기 위해 <strong className="text-gray-200">별도의 테스트 도구를 직접 만들었습니다</strong>.
                운영 환경의 nginx <code className="text-purple-300 bg-purple-900/30 px-1 rounded">access.log</code>는 이미 Kafka로 수집되고 있었는데,
                이 Kafka를 구독해 <strong className="text-gray-200">실제로 들어온 GET 요청을 그대로 새 nginx + Lua 환경으로 재생</strong>했습니다.
                인위적인 부하 테스트가 아니라 <strong className="text-gray-200">실제 사용 패턴과 동일한 요청</strong>으로, 새 구조가 프로덕션과 같게 응답하는지 배포 전에 검증할 수 있었습니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["Nginx", "Lua / OpenResty", "lua-resty-http", "proxy_cache", "slice module", "Kubernetes", "Kafka"].map((t) => (
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
function Metric({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" | "cyan" }) {
  const toneColors: Record<string, string> = {
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    cyan: "text-cyan-300",
  };
  return (
    <div className="card border border-white/5 px-3 py-2.5 text-center">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${tone ? toneColors[tone] : "text-white"}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function FlowBlock({ label, color, children }: { label: string; color: "purple" | "cyan" | "emerald"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    purple: "border-purple-500/30 bg-purple-500/5 text-purple-400",
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
