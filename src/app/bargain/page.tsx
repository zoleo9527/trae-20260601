"use client";

import AppShell from "@/components/app-shell";
import { useAuth, authHeaders } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { fmtDate, fmtMoney } from "@/lib/constants";
import type { OrderStatus, Role } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";

interface OrderLite {
  id: string;
  orderNo: string;
  customerName: string;
  deviceType: string;
  initialPrice: number | null;
  detectPrice: number | null;
  finalPrice: number | null;
  status: OrderStatus;
  statusRemark: string | null;
  receivedAt: string;
  bargains: { id: string; reason: string; result: string; toPrice: number }[];
}

function BargainListInner() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchMsg, setBatchMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("status", "BARGAIN_REVIEW");
    fetch(`/api/orders?${params}`, { headers: authHeaders(user.token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, [user]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function batchApprove() {
    if (!user) return;
    if (selected.length === 0) return alert("请先选择单据");
    setBatchMsg("批量处理中...");
    const r = await fetch("/api/batch", {
      method: "POST",
      headers: authHeaders(user.token),
      body: JSON.stringify({ ids: selected, operation: "BATCH_BARGAIN_APPROVE" }),
    });
    const data = await r.json();
    const success = data.results.filter((x: any) => x.ok).length;
    setBatchMsg(`批量完成：成功 ${success} / ${selected.length}`);
    setSelected([]);
    setTimeout(() => setBatchMsg(""), 3000);
    const params = new URLSearchParams();
    params.set("status", "BARGAIN_REVIEW");
    fetch(`/api/orders?${params}`, { headers: authHeaders(user.token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }

  const canOperate = user?.role === "DETECTER";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">议价复核</h1>
          <p className="text-sm text-slate-500 mt-1">
            检测师对价格争议进行复核并给出结论，原因必填以避免责任不清
          </p>
        </div>
        {canOperate && (
          <div className="flex items-center gap-2">
            {batchMsg && <span className="text-sm text-emerald-700">{batchMsg}</span>}
            <button
              onClick={batchApprove}
              disabled={selected.length === 0}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-40"
            >
              批量通过 {selected.length > 0 && `(${selected.length})`}
            </button>
          </div>
        )}
      </div>

      {!canOperate && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          当前为 <b>{user?.role === "FINANCE" ? "财务" : "收货员"}</b> 视角，仅可查看议价记录，无法操作。请切换为检测师角色进行处理。
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              {canOperate && <th className="px-4 py-3 w-10"></th>}
              <th className="px-4 py-3 text-left font-medium">单号</th>
              <th className="px-4 py-3 text-left font-medium">设备 / 客户</th>
              <th className="px-4 py-3 text-right font-medium">初估 / 检测</th>
              <th className="px-4 py-3 text-left font-medium">最新议价原因</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canOperate ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={canOperate ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                  暂无待复核单据
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  {canOperate && (
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
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <div className="text-slate-500">{fmtMoney(o.initialPrice)}</div>
                    <div>{fmtMoney(o.detectPrice)}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {o.bargains[0]?.reason || o.statusRemark || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canOperate && (
                      <Link
                        href={`/bargain/${o.id}`}
                        className="inline-block px-3 py-1.5 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100"
                      >
                        处理
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BargainListPage() {
  return (
    <AppShell>
      <BargainListInner />
    </AppShell>
  );
}
