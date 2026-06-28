"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, X, Tv, Calendar, RotateCcw, ClipboardList, GitBranch, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

// ── 데모 데이터 ─────────────────────────────────────────────────────────────
const CONTENTS = ["오프닝 영상", "뉴스 클립 A", "광고 30초", "교육 세미나", "이벤트 라이브", "마감 영상"];

interface Channel {
  id: string;
  name: string;
  block: string; // 배치된 블록 색
  head: string; // 헤더 색
}

const CHANNELS: Channel[] = [
  { id: "ch1", name: "채널 1", block: "bg-purple-500/25 border-purple-500/50 text-purple-100", head: "text-purple-300" },
  { id: "ch2", name: "채널 2", block: "bg-cyan-500/25 border-cyan-500/50 text-cyan-100", head: "text-cyan-300" },
  { id: "ch3", name: "채널 3", block: "bg-emerald-500/25 border-emerald-500/50 text-emerald-100", head: "text-emerald-300" },
];

const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

// 초기 사전 구현 가능성 검토 표 (발췌) — 기획서 항목을 동일/추가/수정으로 분류해 범위를 가늠
type ReviewType = "동일" | "추가" | "수정";
const REVIEW_ROWS: { screen: string; item: string; type: ReviewType; note: string }[] = [
  { screen: "콘텐츠 리스트", item: "업로드 시간순 정렬", type: "추가", note: "신규" },
  { screen: "콘텐츠 리스트", item: "코덱·샘플레이트·프레임레이트 등 메타 표시", type: "추가", note: "V2 기능 참조" },
  { screen: "콘텐츠 리스트", item: "편성 예정시간 표시", type: "수정", note: "조회 쿼리 보완" },
  { screen: "콘텐츠 리스트", item: "트랜스코딩 진행률·완료 표시", type: "추가", note: "V2 기능 참조" },
  { screen: "대기화면 리스트", item: "업로드 시간순 정렬", type: "추가", note: "신규" },
  { screen: "공통", item: "통계 호출 · 새로고침 · 페이징 · 삭제", type: "동일", note: "기존 유지" },
];

const REVIEW_BADGE: Record<ReviewType, string> = {
  동일: "bg-white/10 text-gray-400",
  추가: "bg-emerald-500/20 text-emerald-300",
  수정: "bg-amber-500/20 text-amber-300",
};

const cellKey = (channelId: string, slot: string) => `${channelId}|${slot}`;

interface Scheduled {
  content: string;
}

interface Placement {
  slot: string;
  content: string;
}

interface PendingModal {
  channelId: string;
  placements: Placement[];
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function FileLivePage() {
  const [schedule, setSchedule] = useState<Record<string, Scheduled>>({});
  const [selected, setSelected] = useState<string[]>([]); // 다중 선택(순서 유지)
  const [dragging, setDragging] = useState<string[] | null>(null); // 드래그 중인 콘텐츠 묶음
  const [modal, setModal] = useState<PendingModal | null>(null);
  const [rowDragIdx, setRowDragIdx] = useState<number | null>(null); // 모달 내 순서 변경용
  const [movingFrom, setMovingFrom] = useState<string | null>(null); // 편성표에서 옮기는 블록 cellKey

  // 방송 순서는 채널 내 시간순 위치로 계산 → 블록을 옮기면 순서가 자동 반영
  const orderOf = (channelId: string, slot: string) => {
    const occupied = SLOTS.filter((s) => schedule[cellKey(channelId, s)]);
    return occupied.indexOf(slot) + 1;
  };

  // 편성표 블록 이동: 빈 칸이면 이동, 찬 칸이면 두 콘텐츠 교환(swap)
  const moveBlock = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    setSchedule((s) => {
      const next = { ...s };
      const fromItem = next[fromKey];
      if (!fromItem) return s;
      const toItem = next[toKey];
      if (toItem) {
        next[toKey] = fromItem;
        next[fromKey] = toItem;
      } else {
        next[toKey] = fromItem;
        delete next[fromKey];
      }
      return next;
    });
  };

  const toggleSelect = (c: string) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  // 드롭한 시간부터 아래로 비어있는 슬롯에 순서대로 채워넣을 계획을 만든다
  const openSchedule = (contents: string[], channelId: string, slot: string) => {
    if (contents.length === 0) return;
    const startIdx = SLOTS.indexOf(slot);
    const placements: Placement[] = [];
    let ci = 0;
    for (let i = startIdx; i < SLOTS.length && ci < contents.length; i++) {
      const key = cellKey(channelId, SLOTS[i]);
      if (schedule[key]) continue; // 이미 편성된 칸은 건너뜀
      placements.push({ slot: SLOTS[i], content: contents[ci] });
      ci++;
    }
    if (placements.length === 0) return; // 빈 칸이 없으면 무시
    setModal({ channelId, placements });
  };

  const confirmSchedule = () => {
    if (!modal) return;
    const additions: Record<string, Scheduled> = {};
    modal.placements.forEach((p) => {
      additions[cellKey(modal.channelId, p.slot)] = { content: p.content };
    });
    setSchedule((s) => ({ ...s, ...additions }));
    setModal(null);
    setSelected([]);
  };

  // 모달 내 방송 순서 변경: 시간(슬롯)은 시간순 고정, 콘텐츠 배치만 재배열
  const reorderRows = (from: number, to: number) => {
    if (!modal || from === to) return;
    const slotsSeq = modal.placements.map((p) => p.slot);
    const contents = arrayMove(modal.placements.map((p) => p.content), from, to);
    setModal({ ...modal, placements: slotsSeq.map((slot, idx) => ({ slot, content: contents[idx] })) });
  };

  const removeAt = (key: string) => {
    setSchedule((s) => {
      const next = { ...s };
      delete next[key];
      return next;
    });
  };

  const reset = () => {
    setSchedule({});
    setSelected([]);
    setDragging(null);
    setMovingFrom(null);
    setModal(null);
  };

  const count = Object.keys(schedule).length;
  const active = selected.length > 0 || !!dragging || !!movingFrom;
  const modalChannel = modal ? CHANNELS.find((c) => c.id === modal.channelId)! : null;

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
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div>
            <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Live Demo</p>
            <h2 className="text-2xl font-bold mb-2">드래그앤드롭 라이브 편성</h2>
            <p className="text-sm text-gray-400">
              콘텐츠를 채널·시간 칸에 끌어다 놓으면 편성 모달이 열립니다. 여러 개를 선택하면 <strong className="text-gray-300">한 번에 편성</strong>됩니다.
              (구현했던 핵심 기능을 가볍게 재현한 데모)
            </p>
          </div>

          {/* 콘텐츠 풀 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">콘텐츠</p>
              {selected.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-purple-300">{selected.length}개 선택됨</span>
                  <button onClick={() => setSelected([])} className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
                    선택 해제
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {CONTENTS.map((c) => {
                const isSel = selected.includes(c);
                const selIdx = selected.indexOf(c);
                return (
                  <button
                    key={c}
                    draggable
                    onDragStart={() => setDragging(isSel && selected.length > 0 ? selected : [c])}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => toggleSelect(c)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs cursor-grab active:cursor-grabbing transition-all ${
                      isSel
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-200 ring-1 ring-purple-500/30"
                        : "border-white/10 bg-white/3 text-gray-300 hover:border-white/25"
                    }`}
                  >
                    {isSel ? (
                      <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {selIdx + 1}
                      </span>
                    ) : (
                      <GripVertical size={13} className="text-gray-600 shrink-0" />
                    )}
                    {c}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-600">
              💡 칩을 클릭해 여러 개 선택(번호 = 편성 순서) 후 드래그하거나, 선택 뒤 편성표 칸을 클릭하면 그 시간부터 빈 칸에 차례로 채워집니다.
            </p>
          </div>

          {/* 편성표 (채널 × 시간) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} className="text-cyan-400" />
                편성표
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500">편성 {count}건</span>
                {count > 0 && (
                  <button onClick={reset} className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
                    <RotateCcw size={12} />
                    초기화
                  </button>
                )}
              </div>
            </div>

            <div className="card border border-white/5 overflow-x-auto">
              <div className="min-w-[520px]">
                {/* 헤더: 채널 */}
                <div className="grid grid-cols-[64px_repeat(3,1fr)] border-b border-white/10">
                  <div className="px-2 py-2.5 text-[10px] text-gray-600 flex items-center">시간</div>
                  {CHANNELS.map((ch) => (
                    <div key={ch.id} className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 ${ch.head}`}>
                      <Tv size={13} />
                      {ch.name}
                    </div>
                  ))}
                </div>

                {/* 슬롯 행 */}
                {SLOTS.map((slot) => (
                  <div key={slot} className="grid grid-cols-[64px_repeat(3,1fr)] border-b border-white/5 last:border-0">
                    <div className="px-2 py-2 text-[11px] text-gray-500 font-mono flex items-center">{slot}</div>
                    {CHANNELS.map((ch) => {
                      const key = cellKey(ch.id, slot);
                      const item = schedule[key];
                      const isTarget = active && !item;
                      return (
                        <div
                          key={ch.id}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (movingFrom) {
                              moveBlock(movingFrom, key);
                              setMovingFrom(null);
                            } else if (dragging) {
                              openSchedule(dragging, ch.id, slot);
                              setDragging(null);
                            }
                          }}
                          onClick={() => {
                            if (selected.length > 0) openSchedule(selected, ch.id, slot);
                          }}
                          className={`px-1.5 py-1.5 border-l border-white/5 min-h-[48px] transition-colors ${
                            item ? "" : isTarget ? "bg-white/5 cursor-pointer" : ""
                          }`}
                        >
                          {item ? (
                            <div
                              draggable
                              onDragStart={() => setMovingFrom(key)}
                              onDragEnd={() => setMovingFrom(null)}
                              className={`w-full h-full rounded-md border px-2 py-1.5 text-[11px] flex items-start justify-between gap-1 cursor-grab active:cursor-grabbing ${ch.block} ${
                                movingFrom === key ? "opacity-40" : ""
                              } animate-fadeIn`}
                              title="드래그해 다른 칸으로 이동"
                            >
                              <span className="leading-tight">
                                <span className="opacity-60 mr-1">#{orderOf(ch.id, slot)}</span>
                                {item.content}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeAt(key); }}
                                className="shrink-0 -mr-1 -mt-0.5 p-0.5 rounded hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                                title="편성 취소"
                                aria-label="편성 취소"
                              >
                                <X size={16} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            isTarget && <span className="text-[10px] text-gray-600">여기에 놓기</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-600">
              편성 블록을 <span className="text-gray-500">드래그해 다른 칸으로 옮기면</span> 시간·방송 순서가 바뀌고(찬 칸은 교환), <span className="text-gray-500">X</span>를 누르면 취소됩니다. (라이브러리: fullcalendar.js · dragula)
            </p>
          </div>

          {/* 초기 사전 구현 가능성 검토 (발췌) */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList size={14} className="text-purple-400" />
              초기 사전 구현 가능성 검토 <span className="text-gray-600 normal-case font-normal">(발췌)</span>
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              착수 전, 기획서의 화면·항목을 훑어 <strong className="text-gray-400">기존 유지 / 추가 / 수정</strong>으로 분류했습니다.
              상세 명세라기보다 작업 범위와 일정을 가늠하기 위한 전체 그림 용도였고, 아래는 그 일부입니다.
            </p>

            <div className="card border border-white/5 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[460px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2">
                    <th className="px-3 py-2.5 text-left text-gray-500 font-medium w-[120px]">화면</th>
                    <th className="px-3 py-2.5 text-left text-gray-500 font-medium">항목</th>
                    <th className="px-3 py-2.5 text-left text-gray-500 font-medium w-[64px]">구분</th>
                    <th className="px-3 py-2.5 text-left text-gray-500 font-medium w-[110px]">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {REVIEW_ROWS.map((r, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2 text-gray-500 align-top">{r.screen}</td>
                      <td className="px-3 py-2 text-gray-300 align-top leading-relaxed">{r.item}</td>
                      <td className="px-3 py-2 align-top">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${REVIEW_BADGE[r.type]}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 align-top">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 일정 리스크 선제 관리 — 핵심 강조 */}
            <div className="card border border-amber-500/25 bg-amber-500/[0.04] p-4 flex flex-col gap-3 mt-1">
              <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                일정 리스크 선제 관리
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                위 표처럼 항목을 나열해 <strong className="text-gray-200">프로젝트 일정에 위험요소가 될 기능</strong>을 먼저 가려내고,
                각 기능의 <strong className="text-gray-200">구현 가능성을 사전 테스트</strong>했습니다. 구현이 어려운 기능은
                <strong className="text-gray-200"> 초기에 기획자와 빠르게 협의해 기획을 수정</strong>했습니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
                <RiskStep n={1} title="위험요소 식별" desc="일정에 부담되는 기능 선별" />
                <RiskArrow />
                <RiskStep n={2} title="구현 가능성 테스트" desc="사전 검증으로 실현성 확인" />
                <RiskArrow />
                <RiskStep n={3} title="조기 협의 · 기획 수정" desc="불가 기능은 기획자와 빠르게 합의" />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Description (프로젝트 리드 중심) ───────────────────── */}
        <aside className="lg:w-[420px] shrink-0">
          <div className="sticky top-8 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Project</p>
              <h1 className="text-3xl font-bold gradient-text leading-tight">
                파일 라이브<br />편성 UI 고도화
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Catenoid · VOD Console</p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">

              <Section title="핵심 결론">
                기획자·디자이너와 협업해 <strong className="text-gray-200">주어진 기간 내 안전하게 마감</strong>한, 제가
                <strong className="text-gray-200"> 직접 리드한 프로젝트</strong>입니다. 메인 업무와 병행하는 서브 프로젝트로
                하루 2시간씩 길게 가져가면서도, 요구사항을 앞단에서 명확히 잡아 일정 차질 없이 끝까지 끌고 갔습니다.
              </Section>

              <Section title="프로젝트를 이끈 방식">
                <div className="space-y-3 mt-1">
                  <FlowBlock icon={<ClipboardList size={13} />} label="요구사항 정확화" color="purple">
                    초기 기획서를 토대로 화면별 항목을 <strong className="text-gray-300">기존과 동일 / 추가 / 수정</strong>으로 분류해
                    작업 범위와 일정을 가늠했습니다. 상세 명세라기보다 전체 그림을 먼저 잡아두는 용도였습니다.
                  </FlowBlock>
                  <FlowBlock icon={<Calendar size={13} />} label="장기 페이스 관리" color="cyan">
                    하루 2시간씩 길게 가져가는 프로젝트인 만큼, 요구사항을 앞단에서 분명히 해두어 뒤늦은 변경으로 일정이 흔들리는 리스크를 줄였습니다.
                  </FlowBlock>
                  <FlowBlock icon={<GitBranch size={13} />} label="주차별 공유 + 빠른 피드백" color="cyan">
                    <strong className="text-gray-300">dev 서버를 마련해</strong> 매주 진행 내용을 기획자·디자이너에게 공유하고,
                    빠르게 피드백을 받아 곧바로 반영하는 사이클을 돌렸습니다.
                  </FlowBlock>
                  <FlowBlock icon={<CheckCircle2 size={13} />} label="안전한 마감" color="emerald">
                    명확한 범위 + 주차별 공유 + 빠른 피드백 루프 덕분에, 길게 끌고 간 프로젝트를 기한 안에 무리 없이 마무리했습니다.
                  </FlowBlock>
                </div>
              </Section>

              <Section title="구현한 기능">
                복잡하던 편성 과정을 한눈에 다루도록, 드래그앤드롭 중심으로 편성 UX를 다시 설계했습니다.
                <ul className="space-y-2 mt-3">
                  <FeatureItem>콘텐츠를 캘린더에 드래그앤드롭하면 <strong className="text-gray-300">편성 모달</strong>이 열려 라이브 편성을 직관적으로 처리</FeatureItem>
                  <FeatureItem>여러 콘텐츠를 한 번에 끌어다 놓는 <strong className="text-gray-300">다중 드래그 편성</strong> 지원</FeatureItem>
                  <FeatureItem>편성 모달 안에서 드래그로 <strong className="text-gray-300">방송 순서</strong>를 손쉽게 조정</FeatureItem>
                  <FeatureItem>채널별 <strong className="text-gray-300">편성 색상 구분</strong>으로 한눈에 식별</FeatureItem>
                  <FeatureItem>그 외 반복 작업을 줄이는 편의 기능을 지속적으로 개선</FeatureItem>
                </ul>
                <p className="mt-3 text-[11px] text-gray-500">
                  사용 라이브러리 · <span className="text-gray-400 font-mono">fullcalendar.js</span>, <span className="text-gray-400 font-mono">dragula</span>
                </p>
              </Section>

              <Section title="회고">
                기능 난이도보다, <strong className="text-gray-200">길게 가져가는 사이드 프로젝트를 협업으로 일정 안에 안착</strong>시킨 경험이 핵심입니다.
                요구사항 정리 → 주기적 공유 → 빠른 피드백이라는 리듬을 스스로 만들고 지킨 것이 안전한 마감으로 이어졌습니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech & Role</p>
                <div className="flex flex-wrap gap-2">
                  {["Vue", "fullcalendar.js", "dragula", "프로젝트 리드", "기획·디자인 협업"].map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── 편성 모달 ── */}
      {modal && modalChannel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Calendar size={15} className="text-purple-400" />
              <p className="text-sm font-bold text-white">라이브 편성</p>
              <span className="ml-auto text-xs text-gray-500">{modal.placements.length}건</span>
            </div>
            <div className="px-5 py-5 flex flex-col gap-3">
              <Row label="채널" value={modalChannel.name} valueClass={modalChannel.head} />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">편성 목록</span>
                  {modal.placements.length > 1 && (
                    <span className="text-[10px] text-gray-600">행을 드래그해 방송 순서 변경</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {modal.placements.map((p, i) => (
                    <div
                      key={p.slot}
                      draggable={modal.placements.length > 1}
                      onDragStart={() => setRowDragIdx(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (rowDragIdx !== null) reorderRows(rowDragIdx, i);
                        setRowDragIdx(null);
                      }}
                      onDragEnd={() => setRowDragIdx(null)}
                      className={`flex items-center gap-2 text-sm bg-white/3 rounded-lg px-2.5 py-2 transition-all ${
                        modal.placements.length > 1 ? "cursor-grab active:cursor-grabbing hover:bg-white/6" : ""
                      } ${rowDragIdx === i ? "opacity-40" : ""}`}
                    >
                      {modal.placements.length > 1 && <GripVertical size={13} className="text-gray-600 shrink-0" />}
                      <span className="text-[11px] font-mono text-gray-500 w-12 shrink-0">{p.slot}</span>
                      <span className="text-white truncate flex-1">{p.content}</span>
                      <span className="text-[11px] text-purple-300 shrink-0">#{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={confirmSchedule}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors"
                >
                  {modal.placements.length}건 편성하기
                </button>
                <button
                  onClick={() => setModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function FlowBlock({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: "purple" | "cyan" | "emerald"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    purple: "border-purple-500/30 bg-purple-500/5 text-purple-400",
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  };
  const c = colors[color];
  return (
    <div className={`rounded-lg border p-3 ${c.split(" ").slice(0, 2).join(" ")}`}>
      <p className={`text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${c.split(" ")[2]}`}>
        {icon}
        {label}
      </p>
      <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}

function RiskStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex-1 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-4 h-4 rounded-full bg-amber-500/80 text-[10px] font-bold text-black flex items-center justify-center shrink-0">{n}</span>
        <span className="text-xs font-semibold text-gray-200">{title}</span>
      </div>
      <p className="text-[11px] text-gray-500 leading-snug">{desc}</p>
    </div>
  );
}

function RiskArrow() {
  return (
    <div className="flex items-center justify-center shrink-0 text-gray-600">
      <ArrowRight size={14} className="hidden sm:block" />
      <ArrowRight size={14} className="sm:hidden rotate-90" />
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-xs text-gray-400 leading-relaxed list-none">
      <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${valueClass ?? "text-white"}`}>{value}</span>
    </div>
  );
}
