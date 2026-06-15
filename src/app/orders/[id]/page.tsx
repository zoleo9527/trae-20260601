"use client";

import AppShell from "@/components/app-shell";
import { useAuth, authHeaders } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { fmtDate, fmtMoney, ROLE_LABEL, STATUS_LABEL } from "@/lib/constants";
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
interface Payment {
  id: string;
  amount: number;
  payeeName: string;
  payeeBank: string | null;
  payeeAccount: string;
  submitRemark: string | null;
  reviewRemark: string | null;
  paidAt: string | null;
  createdAt: string;
  finance: { id: string; name: string; role: Role } | null;
}
interface OpLog {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  action: string;
  remark: string | null;
  detail: string | null;
  createdAt: string;
  operator: { id: string; name: string; role: Role };
}
interface OrderDetail {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  deviceSn: string | null;
  appearance: string;
  accessories: string | null;
  initialPrice: number | null;
  detectPrice: number | null;
  finalPrice: number | null;
  status: OrderStatus;
  statusRemark: string | null;
  receivedAt: string;
  detectedAt: string | null;
  receiver: { id: string; name: string; role: Role };
  detecter: { id: string; name: string; role: Role } | null;
  bargains: Bargain[];
  payments: Payment[];
  logs: OpLog[];
}

function DetailInner() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.id) return;
    fetch(`/api/orders/${params.id}`, { headers: authHeaders(user.token) })
      .then((r) => (r.ok ? r.json() : Promise.reject("加载失败")))
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [user, params.id]);

  if (loading) return <div className="text-slate-400">加载中...</div>;
  if (!order) return <div className="text-rose-600">单据不存在</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← 返回列表
          </Link>
          <h1 className="font-display text-3xl tracking-wide mt-2">{order.orderNo}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={order.status} />
            <span className="text-sm text-slate-500">
              {order.deviceType} · {order.customerName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "BARGAIN_REVIEW" && user!.role === "DETECTER" && (
            <Link
              href={`/bargain/${order.id}`}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
            >
              处理议价复核
            </Link>
          )}
          {order.status === "BARGAIN_APPROVED" && user!.role === "DETECTER" && (
            <Link
              href={`/payment/${order.id}`}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
            >
              提交打款申请
            </Link>
          )}
          {order.status === "DETECTED" && user!.role === "DETECTER" && (
            <Link
              href={`/bargain/${order.id}`}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
            >
              发起议价复核
            </Link>
          )}
          {order.status === "PAYMENT_REQUESTED" &&
            user!.role === "FINANCE" &&
            order.payments[0] && (
              <Link
                href={`/payment/${order.payments[0].id}`}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
              >
                处理打款
              </Link>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs uppercase text-slate-400 font-medium mb-3">客户与设备</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">客户姓名</dt>
              <dd className="font-medium">{order.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">联系电话</dt>
              <dd className="font-mono text-xs">{order.customerPhone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">设备</dt>
              <dd className="font-medium">{order.deviceType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">序列号</dt>
              <dd className="font-mono text-xs">{order.deviceSn || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">外观</dt>
              <dd className="text-right text-xs max-w-[60%]">{order.appearance}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">配件</dt>
              <dd className="text-right text-xs max-w-[60%]">{order.accessories || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs uppercase text-slate-400 font-medium mb-3">价格</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-baseline">
              <dt className="text-slate-500">收货初估</dt>
              <dd className="font-mono">{fmtMoney(order.initialPrice)}</dd>
            </div>
            <div className="flex justify-between items-baseline">
              <dt className="text-slate-500">检测定价</dt>
              <dd className="font-mono">{fmtMoney(order.detectPrice)}</dd>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <dt className="font-medium">议价最终价</dt>
              <dd className="font-mono text-lg text-brand-700 font-semibold">
                {fmtMoney(order.finalPrice)}
              </dd>
            </div>
          </dl>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <div>收货员：{order.receiver.name} · {fmtDate(order.receivedAt)}</div>
            <div>检测师：{order.detecter?.name || "—"} · {fmtDate(order.detectedAt)}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs uppercase text-slate-400 font-medium mb-3">状态流转时间线</h3>
          <ol className="relative border-l border-slate-200 ml-2 space-y-4">
            {order.logs.map((log) => (
              <li key={log.id} className="ml-4">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{log.operator.name}</span>
                  <span className="text-slate-400">
                    {ROLE_LABEL[log.operator.role]}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {log.fromStatus
                    ? `${STATUS_LABEL[log.fromStatus]} → `
                    : ""}
                  <span className="font-medium text-slate-700">
                    {STATUS_LABEL[log.toStatus]}
                  </span>
                </div>
                {log.remark && (
                  <div className="text-xs text-slate-500 mt-0.5">{log.remark}</div>
                )}
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  {fmtDate(log.createdAt)}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {order.bargains.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-medium">议价复核记录</h3>
            <span className="text-xs text-slate-400">共 {order.bargains.length} 条</span>
          </div>
          <div className="divide-y divide-slate-100">
            {order.bargains.map((b) => (
              <div key={b.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{b.operator.name}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {ROLE_LABEL[b.operator.role]}
                    </span>
                    <span className="text-xs text-slate-400 ml-3 font-mono">
                      {fmtDate(b.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm font-mono">
                    <span className="text-slate-400">{fmtMoney(b.fromPrice)}</span>
                    <span className="mx-2 text-slate-300">→</span>
                    <span className="text-brand-700 font-semibold">{fmtMoney(b.toPrice)}</span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400 mb-0.5">原因</div>
                    <div className="text-slate-700">{b.reason}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-0.5">结论</div>
                    <div className="text-slate-700">{b.result}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.payments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-medium">打款申请记录</h3>
            <span className="text-xs text-slate-400">共 {order.payments.length} 条</span>
          </div>
          <div className="divide-y divide-slate-100">
            {order.payments.map((p) => (
              <div key={p.id} className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">金额</div>
                  <div className="font-mono text-brand-700 font-semibold">
                    {fmtMoney(p.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">收款人</div>
                  <div>{p.payeeName}</div>
                  <div className="text-xs text-slate-400 font-mono">{p.payeeAccount}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">申请备注</div>
                  <div className="text-xs">{p.submitRemark || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">
                    {p.paidAt ? "打款时间" : "处理状态"}
                  </div>
                  <div className="text-xs">
                    {p.paidAt ? (
                      <>
                        <div className="font-mono">{fmtDate(p.paidAt)}</div>
                        <div className="text-slate-500 mt-0.5">
                          {p.finance?.name} · {p.reviewRemark || ""}
                        </div>
                      </>
                    ) : p.reviewRemark ? (
                      <div className="text-amber-700">已退回：{p.reviewRemark}</div>
                    ) : (
                      <span className="text-slate-500">等待处理</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <AppShell>
      <DetailInner />
    </AppShell>
  );
}
