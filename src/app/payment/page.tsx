"use client";

import AppShell from "@/components/app-shell";
import { useAuth, authHeaders } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { fmtDate, fmtMoney, STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus, Role } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PayOrder {
  id: string;
  orderNo: string;
  customerName: string;
  deviceType: string;
  finalPrice: number | null;
  detectPrice: number | null;
  status: OrderStatus;
  statusRemark: string | null;
  bargains: any[];
  payments: { id: string; amount: number; payeeName: string; createdAt: string; paidAt: string | null; reviewRemark: string | null }[];
}

function PaymentListInner() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"requested" | "approved" | "all">("requested");
  const [orders, setOrders] = useState<PayOrder[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchMsg, setBatchMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (tab === "requested") params.set("status", "PAYMENT_REQUESTED");
    else if (tab === "approved") params.set("status", "BARGAIN_APPROVED");
    fetch(`/api/orders?${params}`, { headers: authHeaders(user.token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
    setSelected([]);
  }, [user, tab]);

  const isFinance = user?.role === "FINANCE";
  const isDetecter = user?.role === "DETECTER";

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function batchPaid() {
    if (!user) return;
    if (selected.length === 0) return alert("请先选择打款申请");
    const paymentIds: string[] = [];
    orders.forEach((o) => {
      if (selected.includes(o.id) && o.payments[0]) paymentIds.push(o.payments[0].id);
    });
    setBatchMsg("批量打款处理中...");
    const r = await fetch("/api/batch", {
      method: "POST",
      headers: authHeaders(user.token),
      body: JSON.stringify({ ids: paymentIds, operation: "BATCH_PAYMENT_PAID" }),
    });
    const data = await r.json();
    const success = data.results.filter((x: any) => x.ok).length;
    setBatchMsg(`批量完成：成功 ${success} / ${selected.length}`);
    setSelected([]);
    setTimeout(() => setBatchMsg(""), 3000);
    const params = new URLSearchParams();
    params.set("status", "PAYMENT_REQUESTED");
    fetch(`/api/orders?${params}`, { headers: authHeaders(user.token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }

  async function batchSubmitPayment() {
    if (!user) return;
    if (selected.length === 0) return alert("请先选择单据");
    setBatchMsg("批量提交中...");
    const r = await fetch("/api/batch", {
      method: "POST",
      headers: authHeaders(user.token),
      body: JSON.stringify({ ids: selected, operation: "BATCH_SUBMIT_PAYMENT" }),
    });
    const data = await r.json();
    const success = data.results.filter((x: any) => x.ok).length;
    setBatchMsg(`批量完成：成功 ${success} / ${selected.length}`);
    setSelected([]);
    setTimeout(() => setBatchMsg(""), 3000);
    const params = new URLSearchParams();
    params.set("status", "BARGAIN_APPROVED");
    fetch(`/api/orders?${params}`, { headers: authHeaders(user.token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }

  const tabs = [
    { k: "requested" as const, label: "待打款", count: 0, show: isFinance || isDetecter },
    { k: "approved" as const, label: "待提交打款", count: 0, show: isDetecter },
    { k: "all" as const, label: "全部记录", count: 0, show: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">打款申请</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isFinance
              ? "财务视角：审核打款信息、确认打款或退回；全程留痕"
              : isDetecter
              ? "检测师视角：议价通过后提交打款申请"
              : "仅可查看打款记录"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {batchMsg && <span className="text-sm text-emerald-700">{batchMsg}</span>}
          {tab === "requested" && isFinance && (
            <button
              onClick={batchPaid}
              disabled={selected.length === 0}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-40"
            >
              批量确认打款 {selected.length > 0 && `(${selected.length})`}
            </button>
          )}
          {tab === "approved" && isDetecter && (
            <button
              onClick={batchSubmitPayment}
              disabled={selected.length === 0}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-40"
            >
              批量提交打款 {selected.length > 0 && `(${selected.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t.k
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              {((tab === "requested" && isFinance) || (tab === "approved" && isDetecter)) && (
                <th className="px-4 py-3 w-10"></th>
              )}
              <th className="px-4 py-3 text-left font-medium">单号</th>
              <th className="px-4 py-3 text-left font-medium">设备 / 客户</th>
              <th className="px-4 py-3 text-right font-medium">打款金额</th>
              <th className="px-4 py-3 text-left font-medium">收款人</th>
              <th className="px-4 py-3 text-left font-medium">申请时间</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const pay = o.payments[0];
                const amount = o.finalPrice || o.detectPrice;
                const showCheckbox =
                  (tab === "requested" && isFinance) || (tab === "approved" && isDetecter);
                return (
                  <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    {showCheckbox && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(o.id)}
                          onChange={() => toggle(o.id)}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/orders/${o.id}`} className="text-brand-600 hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.deviceType}</div>
                      <div className="text-xs text-slate-400">{o.customerName}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-brand-700">
                      {fmtMoney(amount)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {pay?.payeeName || (
                        <span className="text-slate-400">待提交</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {pay ? fmtDate(pay.createdAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.status === "PAYMENT_REQUESTED" && isFinance && pay && (
                        <Link
                          href={`/payment/${pay.id}`}
                          className="inline-block px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          处理打款
                        </Link>
                      )}
                      {o.status === "BARGAIN_APPROVED" && isDetecter && (
                        <Link
                          href={`/payment/${o.id}`}
                          className="inline-block px-3 py-1.5 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100"
                        >
                          提交申请
                        </Link>
                      )}
                      {(o.status === "PAYMENT_PAID" ||
                        o.status === "PAYMENT_RETURNED") &&
                        pay && (
                          <Link
                            href={`/payment/${pay.id}`}
                            className="inline-block px-3 py-1.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100"
                          >
                            查看
                          </Link>
                        )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PaymentListPage() {
  return (
    <AppShell>
      <PaymentListInner />
    </AppShell>
  );
}
