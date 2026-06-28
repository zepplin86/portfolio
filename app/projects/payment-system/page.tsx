"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, RefreshCw, CreditCard, Shield } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
type FlowState =
  | "idle"
  | "product_selected"
  | "paying"
  | "payment_loading"
  | "active"
  | "renewing"
  | "renewed";

type DbTab = "payments" | "subscriptions" | "payment_logs" | "subscription_logs";

interface Product {
  id: number;
  name: string;
  price: number;
  discount_price: number;
  amount: number;
  free: boolean;
  grade: string;
  duration: string;
}

const PRODUCTS: Product[] = [
  { id: 2, name: "무료체험 A", price: 0, discount_price: 0, amount: 0, free: true, grade: "pro-A", duration: "30d" },
  { id: 3, name: "무료체험 B", price: 0, discount_price: 0, amount: 0, free: true, grade: "pro-B", duration: "30d" },
  { id: 4, name: "실결제 A", price: 200000, discount_price: 20000, amount: 180000, free: false, grade: "pro-A", duration: "30d" },
];

const CARDS = ["KB국민카드", "신한카드", "현대카드", "삼성카드", "우리카드"];

const GRADE_COLORS: Record<string, string> = {
  "pro-A": "text-violet-400 bg-violet-500/20 border-violet-500/30",
  "pro-B": "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
};

// ── DB record helpers ─────────────────────────────────────────────────────
function makePaymentRecord(productId: number, isRenewal: boolean, prevId: number | null) {
  const p = PRODUCTS.find((p) => p.id === productId)!;
  return {
    id: isRenewal ? 2 : 1,
    content_provider_id: 123,
    user_id: 456,
    product_id: productId,
    price: p.price,
    discount_price: p.discount_price,
    amount: p.amount,
    free: p.free ? 1 : 0,
    subscription_id: 1,
    duration: "30d",
    status: "completed",
    before_payment_id: prevId,
    completed_at: isRenewal ? "2026-02-20 11:00:00" : "2026-01-20 11:00:00",
  };
}

function makeSubscriptionRecord(productId: number, isRenewal: boolean) {
  return {
    id: 1,
    content_provider_id: 123,
    user_id: 456,
    product_id: productId,
    status: "active",
    last_payment_id: isRenewal ? 2 : 1,
    expired_at: isRenewal ? "2026-03-22 00:00:00" : "2026-02-20 00:00:00",
    created_at: "2026-01-20 11:00:00",
  };
}

function makePaymentLog(isRenewal: boolean, action: "결제" | "갱신") {
  return {
    id: isRenewal ? 2 : 1,
    payment_id: isRenewal ? 2 : 1,
    payment_status: action,
    pay_started_at: isRenewal ? "2026-02-20 10:59:55" : "2026-01-20 10:59:55",
    pay_complete_at: isRenewal ? "2026-02-20 11:00:01" : "2026-01-20 11:00:01",
    pg: "KG이니시스",
    pay_result: "정상처리",
    pay_result_code: "0000",
    pay_result_description: "정상적으로 처리되었습니다",
    created_at: isRenewal ? "2026-02-20 11:00:01" : "2026-01-20 11:00:01",
  };
}

function makeSubscriptionLog(action: "구독 시작" | "자동 갱신") {
  return {
    id: action === "구독 시작" ? 1 : 2,
    content_provider_id: 123,
    user_id: 456,
    subscription_id: 1,
    action,
    created_at: action === "구독 시작" ? "2026-01-20 11:00:01" : "2026-02-20 11:00:01",
  };
}

// ── Sub-components ────────────────────────────────────────────────────────
function ProductCard({
  product,
  selected,
  onClick,
}: {
  product: Product;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? "border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30"
          : "border-white/10 bg-white/3 hover:bg-white/6 hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-semibold text-white">{product.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${GRADE_COLORS[product.grade]}`}>
          {product.grade}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        {product.price > 0 && product.discount_price > 0 && (
          <span className="text-xs text-gray-500 line-through">₩{product.price.toLocaleString()}</span>
        )}
        <span className="text-xl font-bold text-white">
          {product.amount === 0 ? "무료" : `₩${product.amount.toLocaleString()}`}
        </span>
        <span className="text-xs text-gray-500">/ {product.duration}</span>
      </div>
      {product.discount_price > 0 && (
        <span className="text-xs text-emerald-400 mt-1 block">
          ₩{product.discount_price.toLocaleString()} 할인 적용
        </span>
      )}
      {product.free && (
        <span className="text-xs text-amber-400 mt-1 block">무료체험 — 카드 정보 불필요</span>
      )}
    </button>
  );
}

function DbTable({ headers, rows, newRowIds }: {
  headers: string[];
  rows: Record<string, unknown>[];
  newRowIds: Set<number>;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-gray-600 py-6 text-center">결제 진행 시 레코드가 생성됩니다</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = row.id as number;
            const isNew = newRowIds.has(id);
            return (
              <tr
                key={id}
                className={`border-b border-white/5 last:border-0 transition-colors ${
                  isNew ? "bg-emerald-500/10" : ""
                }`}
              >
                {headers.map((h) => {
                  const key = h.toLowerCase().replace(/ /g, "_");
                  const val = row[key];
                  return (
                    <td key={h} className={`px-2 py-2 whitespace-nowrap ${isNew ? "text-emerald-300" : "text-gray-400"}`}>
                      {val === null ? <span className="text-gray-600">null</span> : String(val)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function PaymentSystemPage() {
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCard, setSelectedCard] = useState(CARDS[0]);
  const [activeTab, setActiveTab] = useState<DbTab>("payments");

  // DB state
  const [payments, setPayments] = useState<ReturnType<typeof makePaymentRecord>[]>([]);
  const [subscriptions, setSubscriptions] = useState<ReturnType<typeof makeSubscriptionRecord>[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<ReturnType<typeof makePaymentLog>[]>([]);
  const [subscriptionLogs, setSubscriptionLogs] = useState<ReturnType<typeof makeSubscriptionLog>[]>([]);
  const [newRowIds, setNewRowIds] = useState<Set<number>>(new Set());

  const highlightRow = (id: number) => {
    setNewRowIds((prev) => new Set([...prev, id]));
    setTimeout(() => setNewRowIds((prev) => { const s = new Set(prev); s.delete(id); return s; }), 2500);
  };

  const openPaymentModal = () => {
    if (!selectedProduct) return;
    setFlowState("paying");
  };

  const confirmPayment = useCallback(async () => {
    if (!selectedProduct) return;
    setFlowState("payment_loading");
    await new Promise((r) => setTimeout(r, 1500));

    const payment = makePaymentRecord(selectedProduct.id, false, null);
    const subscription = makeSubscriptionRecord(selectedProduct.id, false);
    const log = makePaymentLog(false, "결제");
    const subLog = makeSubscriptionLog("구독 시작");

    setPayments([payment]);
    setSubscriptions([subscription]);
    setPaymentLogs([log]);
    setSubscriptionLogs([subLog]);
    [1, 1, 1, 1].forEach((_, i) => setTimeout(() => highlightRow(1), i * 150));

    setFlowState("active");
  }, [selectedProduct]);

  const simulateRenewal = useCallback(async () => {
    setFlowState("renewing");
    await new Promise((r) => setTimeout(r, 2000));

    const payment2 = makePaymentRecord(selectedProduct!.id, true, 1);
    const subscription2 = makeSubscriptionRecord(selectedProduct!.id, true);
    const log2 = makePaymentLog(true, "갱신");
    const subLog2 = makeSubscriptionLog("자동 갱신");

    setPayments((p) => [...p, payment2]);
    setSubscriptions([subscription2]);
    setPaymentLogs((p) => [...p, log2]);
    setSubscriptionLogs((p) => [...p, subLog2]);

    setTimeout(() => highlightRow(2), 0);
    setTimeout(() => highlightRow(1), 150);

    setFlowState("renewed");
  }, [selectedProduct]);

  const reset = () => {
    setFlowState("idle");
    setSelectedProduct(null);
    setPayments([]);
    setSubscriptions([]);
    setPaymentLogs([]);
    setSubscriptionLogs([]);
    setNewRowIds(new Set());
  };

  const dbData = {
    payments,
    subscriptions,
    payment_logs: paymentLogs,
    subscription_logs: subscriptionLogs,
  };

  const tabHeaders: Record<DbTab, string[]> = {
    payments: ["id", "user_id", "product_id", "amount", "status", "before_payment_id", "completed_at"],
    subscriptions: ["id", "user_id", "product_id", "status", "last_payment_id", "expired_at"],
    payment_logs: ["id", "payment_id", "payment_status", "pg", "pay_result_code", "pay_result", "created_at"],
    subscription_logs: ["id", "subscription_id", "action", "created_at"],
  };

  const tabRows: Record<DbTab, Record<string, unknown>[]> = {
    payments: dbData.payments as Record<string, unknown>[],
    subscriptions: dbData.subscriptions as Record<string, unknown>[],
    payment_logs: dbData.payment_logs as Record<string, unknown>[],
    subscription_logs: dbData.subscription_logs as Record<string, unknown>[],
  };

  const isActive = flowState === "active" || flowState === "renewing" || flowState === "renewed";
  const sub = subscriptions[0];

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
        <div className="flex-1 min-w-0 flex flex-col gap-8">
          <div>
            <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Live Demo</p>
            <h2 className="text-2xl font-bold mb-2">정기 결제 플로우 시뮬레이터</h2>
            <p className="text-sm text-gray-400">상품 선택부터 자동 갱신까지 전체 사이클을 직접 체험해보세요.</p>
          </div>

          {/* ── Step 1: 상품 선택 ── */}
          {!isActive && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Step 1 — 상품 선택</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRODUCTS.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    selected={selectedProduct?.id === p.id}
                    onClick={() => setSelectedProduct(p)}
                  />
                ))}
              </div>
              <button
                disabled={!selectedProduct || flowState === "paying" || flowState === "payment_loading"}
                onClick={openPaymentModal}
                className="mt-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                구독 시작하기
              </button>
            </div>
          )}

          {/* ── Step 2: KG 이니시스 결제창 모달 ── */}
          {(flowState === "paying" || flowState === "payment_loading") && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                {/* 헤더 */}
                <div className="bg-[#1a1a2e] px-5 py-4 flex items-center gap-3 border-b border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <CreditCard size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">KG이니시스 안전결제</p>
                    <p className="text-xs text-gray-500">SSL 보안 인증 결제창</p>
                  </div>
                  <Shield size={14} className="ml-auto text-emerald-400" />
                </div>

                <div className="px-5 py-5 flex flex-col gap-4">
                  {/* 결제 정보 */}
                  <div className="bg-white/3 rounded-xl p-4 flex flex-col gap-2 text-sm">
                    <Row label="상품명" value={selectedProduct?.name ?? ""} />
                    <Row label="결제금액" value={selectedProduct?.amount === 0 ? "무료" : `₩${selectedProduct?.amount.toLocaleString()}`} />
                    <Row label="결제주기" value="30일마다 자동결제" />
                  </div>

                  {/* 카드사 선택 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">카드사 선택</p>
                    <div className="flex flex-wrap gap-2">
                      {CARDS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedCard(c)}
                          disabled={flowState === "payment_loading"}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                            selectedCard === c
                              ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                              : "border-white/10 text-gray-500 hover:border-white/20"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 카드번호 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">카드번호</p>
                    <div className="flex gap-2">
                      {["1234", "5678", "****", "****"].map((part, i) => (
                        <div key={i} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-sm font-mono text-gray-400">
                          {part}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={confirmPayment}
                    disabled={flowState === "payment_loading"}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {flowState === "payment_loading" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        결제 처리 중...
                      </>
                    ) : (
                      "결제하기"
                    )}
                  </button>
                  <button
                    onClick={() => setFlowState("product_selected")}
                    disabled={flowState === "payment_loading"}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-center"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: 구독 대시보드 ── */}
          {isActive && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">구독 대시보드</p>
                <button onClick={reset} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  처음부터
                </button>
              </div>

              <div className="card border border-emerald-500/20 bg-emerald-500/5 p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-300">
                    {flowState === "renewed" ? "자동 갱신 완료" : "구독 활성"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">플랜</p>
                    <p className="font-semibold text-white">{selectedProduct?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">등급</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${GRADE_COLORS[selectedProduct?.grade ?? "pro-A"]}`}>
                      {selectedProduct?.grade}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">다음 결제일</p>
                    <p className="font-semibold text-white text-xs">
                      {flowState === "renewed" ? sub?.expired_at?.slice(0, 10) : "2026-02-20"}
                    </p>
                  </div>
                </div>

                {/* 30일 프로그레스 바 */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>결제일 2026-01-20</span>
                    <span>{flowState === "renewed" ? "D-30 (갱신됨)" : "D-30"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        flowState === "renewed" ? "bg-emerald-500 w-[3%]" : "bg-purple-500 w-[97%]"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 자동 갱신 시뮬레이션 */}
              {flowState === "active" && (
                <button
                  onClick={simulateRenewal}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-300 text-sm font-medium hover:bg-purple-500/20 transition-colors"
                >
                  <RefreshCw size={14} />
                  자동 갱신 시뮬레이션 (D-1 스케줄러 실행)
                </button>
              )}
              {flowState === "renewing" && (
                <div className="flex flex-col gap-2">
                  {["cron 스케줄러 실행", "만료 임박 구독 조회", "KG 이니시스 빌링키 자동결제 API 호출", "결제 결과 기록 및 expired_at 갱신"].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <div className="w-4 h-4 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
                      <span className="text-gray-400">{step}</span>
                    </div>
                  ))}
                </div>
              )}
              {flowState === "renewed" && (
                <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-4 py-3">
                  자동 갱신 완료. expired_at이 30일 연장되었고 새 payment/log 레코드가 생성되었습니다. (DB 탭에서 확인)
                </p>
              )}
            </div>
          )}

          {/* ── Step 4: DB 상태 패널 ── */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">DB 상태</p>
            <div className="card border border-white/5 overflow-hidden">
              {/* 탭 */}
              <div className="flex border-b border-white/5 overflow-x-auto">
                {(["payments", "subscriptions", "payment_logs", "subscription_logs"] as DbTab[]).map((tab) => {
                  const counts: Record<DbTab, number> = {
                    payments: payments.length,
                    subscriptions: subscriptions.length,
                    payment_logs: paymentLogs.length,
                    subscription_logs: subscriptionLogs.length,
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        activeTab === tab
                          ? "text-purple-300 border-b-2 border-purple-400 -mb-px bg-purple-500/5"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {tab}
                      {counts[tab] > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                          {counts[tab]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="p-4">
                <DbTable
                  headers={tabHeaders[activeTab]}
                  rows={tabRows[activeTab]}
                  newRowIds={newRowIds}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Description ───────────────────────────────────────── */}
        <aside className="lg:w-[420px] shrink-0">
          <div className="sticky top-8 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Project</p>
              <h1 className="text-3xl font-bold gradient-text leading-tight">
                KG 이니시스<br />정기 결제 시스템
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Karoom · 2020</p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">

              <Section title="핵심 결론">
                5개 테이블의 명확한 역할 분리와 KG 이니시스 빌링키(Billing Key) 방식을 적용해,
                사용자가 최초 1회만 결제 인증을 거치면 이후 30일마다 서버에서 자동으로 결제가 이루어지는
                완전 자동화 정기 결제 시스템을 구축했습니다.
              </Section>

              <Section title="전체 아키텍처 흐름">
                <div className="space-y-3 mt-1">
                  <FlowBlock label="최초 결제" color="blue">
                    사용자가 상품을 선택하고 KG 이니시스 결제창에서 카드 정보를 입력하면 빌링키가 발급됩니다.
                    서버는 빌링키를 저장하고 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">payments</code>·
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded">subscriptions</code>·
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded">payment_logs</code> 레코드를 생성합니다.
                  </FlowBlock>
                  <FlowBlock label="자동 갱신 (cron)" color="purple">
                    매일 새벽 스케줄러가 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">expired_at &lt;= now() + 1day</code> 구독을
                    조회합니다. 빌링키로 이니시스 자동결제 API를 직접 호출하고, 성공 시 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">expired_at</code>을
                    30일 연장합니다. 실패 시 구독 상태를 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">suspended</code>로 변경 후 유예 처리합니다.
                  </FlowBlock>
                </div>
              </Section>

              <Section title="테이블 설계 의도">
                <ul className="space-y-3 mt-1">
                  <TableItem name="products">
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded">free</code> · <code className="text-purple-300 bg-purple-900/30 px-1 rounded">grade</code> 컬럼으로
                    무료체험과 유료 등급을 단일 테이블에서 통합 관리. 상품 추가 시 코드 변경 없이 데이터만 삽입하면 됩니다.
                  </TableItem>
                  <TableItem name="payments">
                    결제 단건 기록. <code className="text-purple-300 bg-purple-900/30 px-1 rounded">before_payment_id</code>로 이전 결제와 체인을 형성해
                    정기 결제 이력 전체를 역추적할 수 있습니다. 환불 시 어느 회차의 결제인지 즉시 식별 가능합니다.
                  </TableItem>
                  <TableItem name="payment_logs">
                    PG사의 원문 응답(result / result_code / description)을 그대로 보존하는 감사 테이블.
                    분쟁·환불·재처리 시 KG 이니시스 측에 제출할 근거 데이터로 활용됩니다.
                  </TableItem>
                  <TableItem name="subscriptions">
                    구독 주기 관리. <code className="text-purple-300 bg-purple-900/30 px-1 rounded">last_payment_id</code>와 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">expired_at</code>만으로
                    현재 결제 상태와 다음 갱신 시점을 판단할 수 있어 스케줄러 쿼리가 단순해집니다.
                  </TableItem>
                  <TableItem name="subscription_logs">
                    구독 상태 변화 감사 로그. 시작 / 일시정지 / 해지 시점을 기록해 CS 문의 대응과 정산 검증에 활용합니다.
                  </TableItem>
                </ul>
              </Section>

              <Section title="B2B 멀티테넌트 설계">
                모든 테이블에 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">content_provider_id</code>를 포함해
                단일 DB에서 복수의 콘텐츠 사업자(CP) 데이터를 완전히 격리합니다. CP별 상품 구성, 가격 정책, 정산 조회가 독립적으로 가능하며,
                새 CP 온보딩 시 테이블 추가 없이 CP 식별자만 부여하면 됩니다.
              </Section>

              <Section title="멱등성 & 안전성">
                <code className="text-purple-300 bg-purple-900/30 px-1 rounded">before_payment_id</code> 체인 구조는
                동일 구독에 대한 중복 결제를 방지합니다. 스케줄러가 재시도하더라도 이미 같은 주기에 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">before_payment_id</code>를
                가진 레코드가 존재하면 건너뜁니다. <code className="text-purple-300 bg-purple-900/30 px-1 rounded">payment_logs</code>에는
                PG 원문을 항상 남겨 문제 발생 시 재처리 근거를 확보합니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["Next.js", "PHP Laravel", "KG 이니시스", "MySQL", "Cron Scheduler", "Billing Key"].map((t) => (
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

// ── Helper components ─────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
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

function FlowBlock({ label, color, children }: { label: string; color: "blue" | "purple"; children: React.ReactNode }) {
  const colors = {
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    purple: "border-purple-500/30 bg-purple-500/5 text-purple-400",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color].split(" ").slice(0, 2).join(" ")}`}>
      <p className={`text-xs font-semibold mb-1.5 ${colors[color].split(" ")[2]}`}>{label}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}

function TableItem({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 list-none">
      <code className="text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded text-xs shrink-0 self-start mt-0.5">{name}</code>
      <span className="text-xs text-gray-400 leading-relaxed">{children}</span>
    </li>
  );
}
