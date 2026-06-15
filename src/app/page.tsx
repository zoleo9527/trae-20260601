"use client";

import AppShell from "@/components/app-shell";
import { useAuth, authHeaders } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { fmtDate, fmtMoney, ROLE_LABEL, STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus, Role } from "@/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface RecycleOrderListItem {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  initialPrice: number | null;
  detectPrice: number | null;
  finalPrice: number | null;
  status: OrderStatus;
  statusRemark: string | null;
  receivedAt: string;
  receiver: { id: string; name: string; role: Role };
  detecter: { id: string; name: string; role: Role } | null;
  bargains: { id: string; createdAt: string }[];
  payments: { id: string; createdAt: string; amount: number }[];
}

function DashboardInner() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<RecycleOrderListItem[]>([]);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (keyword) params.set("keyword", keyword);
    fetch(`/api/orders?${params.toString()}`, { headers: authHeaders(user.token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, [user, status, keyword]);

  const stats = useMemo(() => {
    const s: Record<string, number> = {};
    orders.forEach((o) => (s[o.status] = (s[o.status] || 0) + 1));
    return s;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">工作台</h1>
        <p className="text-sm text-slate-500 mt-1">
          当前身份：<span className="font-medium text-slate-700">{ROLE_LABEL[user!.role]}</span> ·{" "}
          {user!.name}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setStatus(status === k ? "" : (k as OrderStatus))}
            className={`p-3 rounded-xl border text-left transition ${
              status === k
                ? "border-brand-400 bg-brand-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="text-2xl font-display">{stats[k] || 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索单号 / 客户 / 设备 / 电话"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400"
          />
          {status && (
            <button
              onClick={() => setStatus("")}
              className="text-sm px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              清除筛选
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">单号</th>
                <th className="px-4 py-3 text-left font-medium">设备</th>
                <th className="px-4 py-3 text-left font-medium">客户</th>
                <th className="px-4 py-3 text-right font-medium">初估</th>
                <th className="px-4 py-3 text-right font-medium">检测</th>
                <th className="px-4 py-3 text-right font-medium">最终</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">收货时间</th>
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
                orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {o.orderNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{o.deviceType}</td>
                    <td className="px-4 py-3">
                      <div>{o.customerName}</div>
                      <div className="text-xs text-slate-400">{o.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {fmtMoney(o.initialPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {fmtMoney(o.detectPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-brand-700">
                      {fmtMoney(o.finalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                      {o.statusRemark && (
                        <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {o.statusRemark}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {fmtDate(o.receivedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AppShell>
      <DashboardInner />
    </AppShell>
  );
}
