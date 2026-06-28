"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ── 인라인 SVG 차량 이미지 (외부 의존 없음) ───────────────────────────────
const CAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" fill="none">
  <rect x="20" y="45" width="160" height="40" rx="6" fill="#6366f1"/>
  <path d="M50 45 L70 20 L130 20 L150 45Z" fill="#818cf8"/>
  <circle cx="55" cy="85" r="12" fill="#1e1b4b" stroke="#a5b4fc" stroke-width="2"/>
  <circle cx="55" cy="85" r="6" fill="#4f46e5"/>
  <circle cx="145" cy="85" r="12" fill="#1e1b4b" stroke="#a5b4fc" stroke-width="2"/>
  <circle cx="145" cy="85" r="6" fill="#4f46e5"/>
  <rect x="80" y="25" width="40" height="18" rx="2" fill="#bfdbfe" opacity="0.7"/>
  <rect x="22" y="52" width="20" height="12" rx="2" fill="#fbbf24" opacity="0.8"/>
  <rect x="158" y="52" width="20" height="12" rx="2" fill="#fbbf24" opacity="0.8"/>
</svg>`;

// image.onload → fetch → FileReader.readAsDataURL 방식 (Canvas 없음)
async function imageToBase64(svgString: string): Promise<string> {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      fetch(blobUrl)
        .then((r) => r.blob())
        .then((fetchedBlob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(fetchedBlob);
        })
        .catch(reject);
    };
    img.onerror = reject;
    img.src = blobUrl;
  });
}

// ── 모의 견적서 카드 ──────────────────────────────────────────────────────
function EstimateCard({ imageSrc, broken }: { imageSrc: string | null; broken: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden w-full max-w-sm">
      <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-sm">KAROOM 신차 견적서</span>
        <span className="text-indigo-200 text-xs">2021-06-15</span>
      </div>

      {/* 차량 이미지 영역 */}
      <div className="h-28 bg-gray-50 border-b border-gray-100 flex items-center justify-center relative overflow-hidden">
        {broken ? (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">이미지를 불러올 수 없음</span>
          </div>
        ) : imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="차량 이미지" className="h-full object-contain p-2" />
        ) : (
          <div className="w-6 h-6 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="px-5 py-4 flex flex-col gap-2 text-sm">
        <Row label="모델" value="제네시스 G80 3.5T AWD" />
        <Row label="색상" value="마티라 블루" />
        <Row label="옵션" value="럭셔리 패키지" />
        <div className="border-t border-gray-100 mt-1 pt-2 flex justify-between font-semibold">
          <span className="text-gray-600">견적 금액</span>
          <span className="text-indigo-600">₩ 73,500,000</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────
type DemoState = "idle" | "loading" | "converting" | "done-bug" | "done-fixed";

const FAKE_S3_URL = "https://s3.ap-northeast-2.amazonaws.com/karoom-assets/cars/genesis-g80.png";

export default function KaroomPdfPage() {
  const [state, setState] = useState<DemoState>("idle");
  const [base64, setBase64] = useState<string | null>(null);

  const runBug = useCallback(() => {
    setState("loading");
    setTimeout(() => {
      setState("done-bug");
    }, 800);
  }, []);

  const runFixed = useCallback(async () => {
    setState("loading");
    await new Promise((r) => setTimeout(r, 500));
    setState("converting");
    const data = await imageToBase64(CAR_SVG);
    await new Promise((r) => setTimeout(r, 300));
    setBase64(data);
    setState("done-fixed");
  }, []);

  const reset = () => {
    setState("idle");
    setBase64(null);
  };

  const imageSrc = state === "done-fixed" ? base64 : null;
  const isLoading = state === "loading" || state === "converting";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 px-6 py-4">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          포트폴리오로 돌아가기
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">

        {/* ── LEFT: Interactive Demo ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-8">
          <div>
            <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Live Demo</p>
            <h2 className="text-2xl font-bold mb-2">PDF 이미지 렌더링 버그 재현</h2>
            <p className="text-sm text-gray-400">두 버튼으로 버그 버전과 해결 버전을 직접 비교해보세요.</p>
          </div>

          {/* 버튼 */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runBug}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-40"
            >
              버그 버전으로 PDF 생성
            </button>
            <button
              onClick={runFixed}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
            >
              해결 버전으로 PDF 생성
            </button>
            {state !== "idle" && !isLoading && (
              <button onClick={reset} className="px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/30 transition-colors">
                초기화
              </button>
            )}
          </div>

          {/* 단계 표시 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Step active={state !== "idle"} done={state !== "idle" && state !== "loading"} label="image.onload" />
            <div className="w-6 h-px bg-white/10" />
            <Step active={state === "converting" || state === "done-fixed"} done={state === "done-fixed"} label="FileReader.readAsDataURL()" />
            <div className="w-6 h-px bg-white/10" />
            <Step
              active={state === "done-bug" || state === "done-fixed"}
              done={state === "done-bug" || state === "done-fixed"}
              label="PDF 준비 완료"
              color={state === "done-bug" ? "red" : "emerald"}
            />
          </div>

          {/* 결과 */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <EstimateCard imageSrc={imageSrc} broken={state === "done-bug"} />

            {(state === "done-bug" || state === "done-fixed") && (
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">img src 비교</p>
                <div className="rounded-lg overflow-hidden border border-white/10 text-xs font-mono">
                  <div className="bg-red-950/50 border-b border-white/5 px-4 py-3">
                    <p className="text-red-400 mb-1">— 버그 버전</p>
                    <p className="text-gray-400 break-all">{FAKE_S3_URL}</p>
                  </div>
                  <div className={`px-4 py-3 ${state === "done-fixed" ? "bg-emerald-950/50" : "bg-white/3"}`}>
                    <p className={`mb-1 ${state === "done-fixed" ? "text-emerald-400" : "text-gray-600"}`}>
                      {state === "done-fixed" ? "+ 해결 버전" : "+ 해결 버전 (버그 버전에서 미실행)"}
                    </p>
                    <p className="text-gray-400 break-all">
                      {state === "done-fixed" && base64
                        ? base64.slice(0, 60) + "…"
                        : "data:image/svg+xml;base64,[변환 필요]"}
                    </p>
                  </div>
                </div>

                {state === "done-bug" && (
                  <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
                    react-pdf가 새 컴포넌트를 생성할 때 외부 URL 이미지가 아직 로드되지 않아 빈칸으로 출력됩니다.
                  </p>
                )}
                {state === "done-fixed" && (
                  <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-4 py-3">
                    image.onload 후 FileReader로 base64 인코딩해 react-pdf에 직접 주입. 네트워크 요청 없이 즉시 렌더링됩니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Description ───────────────────────────────────────── */}
        <aside className="lg:w-96 shrink-0">
          <div className="sticky top-8 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Project</p>
              <h1 className="text-3xl font-bold gradient-text leading-tight">
                PDF 견적서<br />이미지 렌더링 버그 해결
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Karoom · 2021</p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">
              <Section title="핵심 해결책">
                미리보기 화면에서 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">image.onload</code> 이벤트로 이미지가 로드된 시점을 잡고, <code className="text-purple-300 bg-purple-900/30 px-1 rounded">FileReader.readAsDataURL()</code>로 base64 인코딩해 react-pdf에 data URI로 직접 주입했습니다. 외부 URL 로딩 타이밍 문제를 근본적으로 제거한 방법입니다.
              </Section>

              <Section title="배경">
                카룸의 신차 견적 기능에 PDF 다운로드를 추가하는 작업이었습니다. react-pdf로 구현한 뒤 테스트 중 차량 이미지가 PDF에 간헐적으로 출력되지 않는 버그를 발견했습니다.
              </Section>

              <Section title="원인 추적">
                세 가지 가설을 순서대로 검증했습니다.
                <ol className="list-decimal list-inside space-y-1.5 mt-2 pl-1">
                  <li><span className="line-through text-gray-600">이미지 경로가 잘못됨</span> — 경로 정상 확인</li>
                  <li><span className="line-through text-gray-600">react-pdf가 이미지를 미지원</span> — GitHub에서 지원 확인</li>
                  <li className="text-white">이미지가 마운트 타이밍에 캐시되지 않음 — <span className="text-cyan-400">원인 확정</span></li>
                </ol>
                <p className="mt-2">
                  라이브러리 소스를 분석한 결과, react-pdf는 PDF 출력 시 새 컴포넌트를 생성하며, 이때 외부 URL 이미지 로딩이 완료되지 않으면 빈칸으로 처리되는 구조였습니다.
                </p>
              </Section>

              <Section title="해결 과정">
                단순 preload만으로는 캐시를 보장할 수 없다고 판단했습니다. 미리보기 화면에서 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">&lt;img&gt;</code> 태그에 S3 URL을 넣고, <code className="text-purple-300 bg-purple-900/30 px-1 rounded">onload</code> 콜백에서 해당 이미지를 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">FileReader</code>로 읽어 base64 문자열로 변환했습니다. 이후 react-pdf에는 S3 URL 대신 이 base64 data URI를 전달해 문제를 완전히 해결했습니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["Next.js", "react-pdf", "FileReader API", "Base64", "AWS S3"].map((t) => (
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-gray-400">{children}</div>
    </div>
  );
}

function Step({ active, done, label, color = "purple" }: {
  active: boolean; done: boolean; label: string; color?: "purple" | "red" | "emerald";
}) {
  const colors = {
    purple: "text-purple-400 bg-purple-500/20 border-purple-500/40",
    red: "text-red-400 bg-red-500/20 border-red-500/40",
    emerald: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs font-mono transition-all ${
      done ? colors[color] : active ? "text-yellow-400 bg-yellow-500/20 border-yellow-500/40 animate-pulse" : "text-gray-600 bg-white/3 border-white/10"
    }`}>
      {label}
    </span>
  );
}
