"use client";

import AppShell from "@/components/app-shell";
import { useAuth, authHeaders } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { fmtDate, fmtMoney } from "@/lib/constants";
import type { OrderStatus, Role } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface OrderDetect {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  appearance: string;
  accessories: string | null;
  initialPrice: number | null;
  detectPrice: number | null;
  status: OrderStatus;
  receivedAt: string;
  receiver: { id: string; name: string; role: Role };
}

function DetectInner() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetect | null>(null);
  const [loading, setLoading] = useState(true);
  const [detectPrice, setDetectPrice] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !params.id) return;
    fetch(`/api/orders/${params.id}`, { headers: authHeaders(user.token) })
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        if (d.detectPrice) setDetectPrice(String(d.detectPrice));
      })
      .finally(() => setLoading(false));
  }, [user, params.id]);

  async function submit() {
    if (!order || !user) return;
    if (!detectPrice || isNaN(Number(detectPrice)) || Number(detectPrice) <= 0) {
      setError("请输入有效的检测价格");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const r = await fetch(`/api/orders/${order.id}/detect`, {
        method: "POST",
        headers: authHeaders(user.token),
        body: JSON.stringify({ detectPrice: Number(detectPrice), remark }),
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

  const canEdit = order.status === "RECEIVED" && user?.role === "DETECTER";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href={`/orders/${order.id}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回订单详情
        </Link>
        <h1 className="font-display text-3xl tracking-wide mt-2">检测定价</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="font-mono text-sm">{order.orderNo}</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-slate-400 mb-1">设备</div>
          <div className="font-medium">{order.deviceType}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">客户</div>
          <div>{order.customerName}（{order.customerPhone}）</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">外观</div>
          <div>{order.appearance}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">配件</div>
          <div>{order.accessories || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">收货初估价</div>
          <div className="font-mono text-lg">{fmtMoney(order.initialPrice)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">收货员</div>
          <div>
            {order.receiver.name} · <span className="font-mono text-xs">{fmtDate(order.receivedAt)}</span>
          </div>
        </div>
      </div>

      {order.status !== "RECEIVED" ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-sm">
          当前订单状态为「{order.status}」，仅「收货入库」状态可进行检测定价。
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              检测定价（元） <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={detectPrice}
              onChange={(e) => setDetectPrice(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400 font-mono text-lg disabled:bg-slate-50"
              placeholder="请输入检测后的评估价格"
            />
            <p className="text-xs text-slate-400 mt-1">
              收货初估价为 {fmtMoney(order.initialPrice)}，可根据检测结果上调或下调
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">检测说明</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={!canEdit}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400 text-sm disabled:bg-slate-50"
              placeholder="例如：屏幕有轻微划痕，电池健康度 89%，功能正常"
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
              disabled={submitting || !canEdit}
              className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-40"
            >
              {submitting ? "提交中..." : "提交检测结果"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetectPage() {
  return (
    <AppShell>
      <DetectInner />
    </AppShell>
  );
}
