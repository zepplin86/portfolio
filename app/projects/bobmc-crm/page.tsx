"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ── Mock data ──────────────────────────────────────────────────────────────
const COLUMNS = ["고객명", "전화번호", "상태", "담당자", "등록일"];

const ROWS = [
  ["김철수", "010-1234-5678", "신규", "박재영", "2018-03-12"],
  ["이영희", "010-9876-5432", "진행중", "김민준", "2018-03-14"],
  ["박민수", "010-5555-1234", "완료", "박재영", "2018-03-15"],
  ["정지우", "010-7777-8888", "보류", "이수진", "2018-03-16"],
  ["최한나", "010-3333-4444", "신규", "김민준", "2018-03-17"],
];

// ── Contrast logic (core of the actual feature) ────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getContrastBg(hex: string): string | undefined {
  const { r, g, b } = hexToRgb(hex);
  if (r < 110 && g < 110 && b < 110) return "#e8e8f0"; // 어두운 글자 → 밝은 배경
  if (r > 200 && g > 200 && b > 200) return "#2a1a2a"; // 밝은 글자 → 어두운 배경
  return undefined;
}

function isDark(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return r < 110 && g < 110 && b < 110;
}

function isLight(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return r > 200 && g > 200 && b > 200;
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function BobmcCrmPage() {
  const [colors, setColors] = useState<Record<string, string>>({
    고객명: "#7c3aed",
    전화번호: "#ffffff",
    상태: "#059669",
    담당자: "#2563eb",
    등록일: "#111111",
  });
  const [activeCol, setActiveCol] = useState<string | null>(null);

  const setColor = (col: string, hex: string) =>
    setColors((prev) => ({ ...prev, [col]: hex }));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
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

        {/* ── LEFT: Interactive Demo ────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Live Demo</p>
          <h2 className="text-2xl font-bold mb-2">CRM 컬럼 글자색 커스터마이징</h2>
          <p className="text-sm text-gray-400 mb-8">
            컬럼 헤더를 클릭해 글자색을 선택하세요.
          </p>

          {/* Color pickers */}
          <div className="flex flex-wrap gap-3 mb-6">
            {COLUMNS.map((col) => {
              return (
                <button
                  key={col}
                  onClick={() => setActiveCol(activeCol === col ? null : col)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    activeCol === col
                      ? "border-purple-500/60 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: colors[col] }}
                  />
                  {col}
                </button>
              );
            })}
          </div>

          {/* Inline color picker */}
          {activeCol && (
            <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/3 flex items-center gap-4">
              <input
                type="color"
                value={colors[activeCol]}
                onChange={(e) => setColor(activeCol, e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <div>
                <p className="text-sm font-medium">
                  <span className="text-gray-400">컬럼:</span>{" "}
                  <span className="text-white">{activeCol}</span>
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {colors[activeCol].toUpperCase()}
                  {" · "}
                  {(() => {
                    const { r, g, b } = hexToRgb(colors[activeCol]);
                    return `RGB(${r}, ${g}, ${b})`;
                  })()}
                </p>
                {isDark(colors[activeCol]) && (
                  <p className="text-xs text-amber-400 mt-1">
                    ⚠ 어두운 글자색 — 배경색이 밝게 자동 전환됩니다
                  </p>
                )}
                {isLight(colors[activeCol]) && (
                  <p className="text-xs text-amber-400 mt-1">
                    ⚠ 밝은 글자색 — 배경색이 어둡게 자동 전환됩니다
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Table preview */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {COLUMNS.map((col) => (
                    <th
                      key={col}
                      onClick={() => setActiveCol(activeCol === col ? null : col)}
                      className="px-4 py-3 text-left font-semibold cursor-pointer select-none border-b border-black/10 hover:bg-gray-200 transition-colors"
                      style={{ color: colors[col] }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, ri) => (
                  <tr
                    key={ri}
                    className={`border-b border-black/5 last:border-0 transition-colors ${
                      ri % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    {row.map((cell, ci) => {
                      const col = COLUMNS[ci];
                      return (
                        <td
                          key={ci}
                          className="px-4 py-3 rounded-sm transition-colors"
                          style={{
                            color: colors[col],
                            backgroundColor: getContrastBg(colors[col]),
                          }}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-600 mt-3">
            * RGB 모두 110 미만(어두운 글자) → 밝은 배경 자동 전환 / RGB 모두 200 초과(밝은 글자) → 어두운 배경 자동 전환
          </p>
        </div>

        {/* ── RIGHT: Description ───────────────────────────────────────── */}
        <aside className="lg:w-96 shrink-0">
          <div className="sticky top-8 flex flex-col gap-6">

            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Project</p>
              <h1 className="text-3xl font-bold gradient-text leading-tight">
                CRM 컬럼 글자색<br />커스터마이징
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">BOBMC · 2018</p>
            </div>

            <div className="card p-5 flex flex-col gap-4 text-sm text-gray-400 leading-relaxed">
              <Section title="배경">
                PHP CodeIgniter 기반 사내 CRM 개발 중, 데이터 테이블의 컬럼별
                글자색을 사용자가 직접 지정할 수 있게 해달라는 요구사항이 들어왔습니다.
                당시 React/npm 생태계가 도입되기 전, 순수 PHP + jQuery 환경이었습니다.
              </Section>

              <Section title="문제 분해">
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>사용자가 색상을 쉽게 선택할 수 있어야 한다</li>
                  <li>선택한 색상을 즉시 눈으로 확인할 수 있어야 한다</li>
                  <li>지정한 값이 저장되어 이후 접속에도 유지되어야 한다</li>
                </ol>
              </Section>

              <Section title="구현">
                <ul className="space-y-2">
                  <Item>직접 구현이 복잡한 컬러 피커는 오픈소스 라이브러리를 채택하여 일정 내 해결</Item>
                  <Item>선택한 색상을 mock 데이터 테이블에 즉시 반영해 실시간 미리보기 제공</Item>
                  <Item>RGB 값으로 DB에 저장, 렌더링 시 인라인 스타일로 적용</Item>
                </ul>
              </Section>

              <Section title="이슈 & 해결">
                테이블 기본 배경이 흰색이라, 글자색이 흰색에 가까워질 경우 가독성이
                크게 떨어지는 문제가 발생했습니다.
                <br /><br />
                RGB 세 값이 모두 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">110 이하</code>이면
                글자가 어두운 계열임을 추리하여, 해당 조건에서 셀 배경을 어두운 색으로
                자동 전환하는 방식으로 해결했습니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["PHP CodeIgniter", "MySQL", "jQuery", "Ajax", "CSS"].map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                      {t}
                    </span>
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

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 list-none">
      <span className="text-cyan-500 shrink-0 mt-0.5">▸</span>
      <span>{children}</span>
    </li>
  );
}
