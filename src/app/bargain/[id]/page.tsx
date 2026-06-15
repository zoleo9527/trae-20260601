"use client";

import AppShell from "@/components/app-shell";
import { useAuth, authHeaders } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { fmtDate, fmtMoney } from "@/lib/constants";
import type { OrderStatus, Role } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Bargain {
  id: string;
  fromPrice: number | null;
  toPrice: number;
  reason: string;
  result: string;
  action: string;
  createdAt: string;
  operator: { id: string; name: string; role: Role };
}
interface OrderBargain {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  appearance: string;
  accessories: string | null;
  initialPrice: number | null;
  detectPrice: number | null;
  finalPrice: number | null;
  status: OrderStatus;
  bargains: Bargain[];
  receivedAt: string;
}

type Action = "APPROVE" | "REJECT" | "ADJUST_AND_APPROVE";

function BargainInner() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderBargain | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action>("APPROVE");
  const [toPrice, setToPrice] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !params.id) return;
    fetch(`/api/orders/${params.id}`, { headers: authHeaders(user.token) })
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        const p = d.finalPrice || d.detectPrice || d.initialPrice;
        if (p) setToPrice(String(p));
      })
      .finally(() => setLoading(false));
  }, [user, params.id]);

  async function submit() {
    if (!user || !order) return;
    if (!reason.trim()) {
      setError("请填写议价原因（必填，避免事后说不清）");
      return;
    }
    if (action === "ADJUST_AND_APPROVE" && (!toPrice || isNaN(Number(toPrice)))) {
      setError("请输入调整后的价格");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      // 如果当前不是 BARGAIN_REVIEW，先提交进入复核状态
      let targetId = order.id;
      if (order.status === "DETECTED") {
        const r1 = await fetch(`/api/orders/${order.id}/bargain`, {
          method: "POST",
          headers: authHeaders(user.token),
          body: JSON.stringify({
            action: "SUBMIT_REVIEW",
            reason: "进入议价复核：" + reason,
          }),
        });
        if (!r1.ok) throw new Error((await r1.json()).error);
      }
      const r = await fetch(`/api/orders/${targetId}/bargain`, {
        method: "POST",
        headers: authHeaders(user.token),
        body: JSON.stringify({
          action,
          toPrice: toPrice ? Number(toPrice) : undefined,
          reason,
          result: result || reason,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      router.push(`/orders/${order.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>加载中...</div>;
  if (!order) return <div>未找到单据</div>;

  const basePrice = order.finalPrice || order.detectPrice || order.initialPrice;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/bargain" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回议价列表
        </Link>
        <h1 className="font-display text-3xl tracking-wide mt-2">议价复核处理</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="font-mono text-sm">{order.orderNo}</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-medium">设备与价格</h3>
          <div className="text-sm">
            <div className="text-slate-500 text-xs mb-1">设备</div>
            <div>{order.deviceType}</div>
          </div>
          <div className="text-sm">
            <div className="text-slate-500 text-xs mb-1">客户</div>
            <div>{order.customerName}（{order.customerPhone}）</div>
          </div>
          <div className="text-sm">
            <div className="text-slate-500 text-xs mb-1">外观</div>
            <div>{order.appearance}</div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-sm">
            <div>
              <div className="text-slate-500 text-xs mb-1">初估</div>
              <div className="font-mono">{fmtMoney(order.initialPrice)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">检测</div>
              <div className="font-mono">{fmtMoney(order.detectPrice)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">当前价</div>
              <div className="font-mono font-semibold text-brand-700">
                {fmtMoney(basePrice)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-medium mb-3">历史议价记录</h3>
          {order.bargains.length === 0 ? (
            <p className="text-sm text-slate-400">暂无记录</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-auto">
              {order.bargains.map((b) => (
                <div key={b.id} className="p-3 rounded-lg bg-slate-50 text-sm">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{b.operator.name}</span>
                    <span className="font-mono">{fmtDate(b.createdAt)}</span>
                  </div>
                  <div className="mt-1 font-mono">
                    {fmtMoney(b.fromPrice)} →{" "}
                    <span className="text-brand-700 font-semibold">{fmtMoney(b.toPrice)}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">原因：{b.reason}</div>
                  <div className="text-xs text-slate-600">结论：{b.result}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-medium">复核结论</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(
            [
              { v: "APPROVE", label: "通过原价格", desc: "维持当前价格，议价通过" },
              {
                v: "ADJUST_AND_APPROVE",
                label: "调整价格后通过",
                desc: "修改价格并直接通过",
              },
              { v: "REJECT", label: "驳回复核", desc: "退回重新检测定价" },
            ] as { v: Action; label: string; desc: string }[]
          ).map((o) => (
            <label
              key={o.v}
              className={`p-3 rounded-lg border cursor-pointer transition ${
                action === o.v
                  ? "border-brand-400 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                className="hidden"
                checked={action === o.v}
                onChange={() => setAction(o.v)}
              />
              <div className="text-sm font-medium">{o.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{o.desc}</div>
            </label>
          ))}
        </div>

        {action === "ADJUST_AND_APPROVE" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              调整后价格（元）
            </label>
            <input
              type="number"
              value={toPrice}
              onChange={(e) => setToPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400 font-mono"
              placeholder="请输入调整后价格"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            复核原因 <span className="text-rose-500">*</span>
            <span className="text-xs text-slate-400 font-normal ml-2">
              必填，写入操作日志，避免责任不清
            </span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400 text-sm"
            placeholder="例如：客户对比市场价格后仍认为偏高，经核实外观划痕轻微，同意在原检测价基础上调 ¥200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">结论描述</label>
          <input
            type="text"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400 text-sm"
            placeholder="留空则与原因一致"
          />
        </div>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={submit}
            disabled={submitting || user?.role !== "DETECTER"}
            className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-40"
          >
            {submitting ? "提交中..." : "提交复核结论"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BargainPage() {
  return (
    <AppShell>
      <BargainInner />
    </AppShell>
  );
}
