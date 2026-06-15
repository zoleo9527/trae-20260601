"use client";

import AppShell from "@/components/app-shell";
import { useAuth, authHeaders } from "@/components/auth-provider";
import { fmtMoney } from "@/lib/constants";
import type { OrderStatus, Role } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PayOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  finalPrice: number | null;
  detectPrice: number | null;
  status: OrderStatus;
  bargains: { id: string; reason: string; result: string; toPrice: number }[];
}

// 此页有两种路由：
// /payment/[orderId]   —— 订单 id，检测师提交打款申请（BARGAIN_APPROVED）
// /payment/[paymentId] —— 打款申请 id，财务处理打款（PAYMENT_REQUESTED / 已完成回看）
function PaymentInner() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [mode, setMode] = useState<"submit" | "review" | null>(null);
  const [order, setOrder] = useState<PayOrder | null>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 表单
  const [payeeName, setPayeeName] = useState("");
  const [payeeBank, setPayeeBank] = useState("");
  const [payeeAccount, setPayeeAccount] = useState("");
  const [submitRemark, setSubmitRemark] = useState("");
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewAction, setReviewAction] = useState<"PAID" | "RETURNED">("PAID");

  useEffect(() => {
    if (!user || !params.id) return;
    setLoading(true);
    // 先尝试当 payment id 查（通过 /api/orders 的列表无法直接取 payment）
    fetch(`/api/orders/${params.id}`, { headers: authHeaders(user.token) })
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        // 作为订单查到了
        setOrder(d);
        setPayeeName(d.customerName);
        if (d.status === "BARGAIN_APPROVED") {
          setMode("submit");
        } else if (d.payments?.[0]) {
          // 是订单，但已有 payment，跳转到 payment 详情
          setPayment(d.payments[0]);
          setMode("review");
        }
      })
      .catch(() => {
        // 可能传入的是 payment id —— 通过 orders/_all 来找
        fetch(`/api/orders`, { headers: authHeaders(user.token) })
          .then((r) => r.json())
          .then(({ orders }) => {
            for (const o of orders) {
              const p = o.payments?.find((x: any) => x.id === params.id);
              if (p) {
                setOrder(o);
                setPayment(p);
                setMode("review");
                return;
              }
            }
            throw new Error("未找到相关单据");
          })
          .catch((e) => setError(e.message))
          .finally(() => setLoading(false));
        return;
      })
      .finally(() => {
        // 如果前面 throw 了这个会重复，但是设置 loading 没问题
        setTimeout(() => setLoading(false), 0);
      });
  }, [user, params.id]);

  async function handleSubmit() {
    if (!order || !user) return;
    if (!payeeName || !payeeAccount) {
      setError("收款人姓名和账号必填");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const r = await fetch(`/api/orders/${order.id}/payment`, {
        method: "POST",
        headers: authHeaders(user.token),
        body: JSON.stringify({ payeeName, payeeBank, payeeAccount, submitRemark }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      router.push("/payment");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview() {
    if (!payment || !user) return;
    if (reviewAction === "RETURNED" && !reviewRemark.trim()) {
      setError("退回必须填写备注原因");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const r = await fetch(`/api/payments/${payment.id}/review`, {
        method: "POST",
        headers: authHeaders(user.token),
        body: JSON.stringify({ action: reviewAction, reviewRemark }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      router.push("/payment");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>加载中...</div>;
  if (error && !order)
    return <div className="text-rose-600">{error}</div>;
  if (!order) return <div>未找到单据</div>;

  const amount = order.finalPrice || order.detectPrice;
  const isFinance = user?.role === "FINANCE";
  const isDetecter = user?.role === "DETECTER";
  const canSubmit = mode === "submit" && isDetecter;
  const canReview = mode === "review" && isFinance && payment && !payment.paidAt && !payment.reviewRemark;
  const readonly = mode === "review" && (payment?.paidAt || payment?.reviewRemark);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href="/payment" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回打款列表
        </Link>
        <h1 className="font-display text-3xl tracking-wide mt-2">
          {mode === "submit" ? "提交打款申请" : readonly ? "打款记录回看" : "处理打款申请"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          订单号 <span className="font-mono">{order.orderNo}</span> · {order.deviceType} · {order.customerName}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-slate-400 mb-1">议价最终价</div>
          <div className="font-mono text-xl text-brand-700 font-semibold">{fmtMoney(amount)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">客户联系电话</div>
          <div className="font-mono">{order.customerPhone}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs text-slate-400 mb-1">最近一次议价结论</div>
          <div className="text-sm">
            {order.bargains?.[0] ? (
              <>
                <span className="text-slate-600">{order.bargains[0].reason}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-medium">{order.bargains[0].result}</span>
              </>
            ) : (
              <span className="text-slate-400">议价通过（无争议）</span>
            )}
          </div>
        </div>
      </div>

      {mode === "submit" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-medium">打款账户信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                收款人姓名 <span className="text-rose-500">*</span>
              </label>
              <input
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400"
                placeholder="请输入收款人姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">开户行</label>
              <input
                value={payeeBank}
                onChange={(e) => setPayeeBank(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400"
                placeholder="如 招商银行"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              收款账号 <span className="text-rose-500">*</span>
            </label>
            <input
              value={payeeAccount}
              onChange={(e) => setPayeeAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400 font-mono"
              placeholder="银行卡号 / 支付宝 / 微信账号"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">申请备注</label>
            <textarea
              value={submitRemark}
              onChange={(e) => setSubmitRemark(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400 text-sm"
              placeholder="可选，如加急、特殊说明等"
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
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-40"
            >
              {submitting ? "提交中..." : "提交打款申请"}
            </button>
          </div>
        </div>
      )}

      {mode === "review" && payment && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-medium">打款账户信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-400 mb-1">收款人</div>
              <div className="font-medium">{payment.payeeName}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">开户行</div>
              <div>{payment.payeeBank || "—"}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-slate-400 mb-1">收款账号</div>
              <div className="font-mono">{payment.payeeAccount}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-slate-400 mb-1">申请备注</div>
              <div className="text-slate-600">{payment.submitRemark || "—"}</div>
            </div>
          </div>

          {readonly ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-sm">
                <span className="text-slate-500">处理结果：</span>
                {payment.paidAt ? (
                  <span className="text-emerald-700 font-medium">已打款</span>
                ) : (
                  <span className="text-amber-700 font-medium">已退回</span>
                )}
              </div>
              {payment.paidAt && (
                <div className="text-sm">
                  <span className="text-slate-500">打款时间：</span>
                  <span className="font-mono">{new Date(payment.paidAt).toLocaleString()}</span>
                </div>
              )}
              <div className="text-sm">
                <span className="text-slate-500">处理人：</span>
                <span>{payment.finance?.name || "—"}</span>
              </div>
              {payment.reviewRemark && (
                <div className="text-sm">
                  <span className="text-slate-500">处理备注：</span>
                  <span>{payment.reviewRemark}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      reviewAction === "PAID"
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      checked={reviewAction === "PAID"}
                      onChange={() => setReviewAction("PAID")}
                    />
                    <div className="text-sm font-medium">确认打款</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      核验账户无误，已完成打款
                    </div>
                  </label>
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      reviewAction === "RETURNED"
                        ? "border-rose-400 bg-rose-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      checked={reviewAction === "RETURNED"}
                      onChange={() => setReviewAction("RETURNED")}
                    />
                    <div className="text-sm font-medium">退回申请</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      信息有误，退回重新提交
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    处理备注 {reviewAction === "RETURNED" && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    value={reviewRemark}
                    onChange={(e) => setReviewRemark(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400 text-sm"
                    placeholder={
                      reviewAction === "RETURNED"
                        ? "请填写退回原因（必填，便于检测师重新提交）"
                        : "可选，如打款流水号、时间等"
                    }
                  />
                </div>
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
                  onClick={handleReview}
                  disabled={submitting || !canReview}
                  className={`px-5 py-2 rounded-lg text-white text-sm disabled:opacity-40 ${
                    reviewAction === "PAID"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting ? "处理中..." : reviewAction === "PAID" ? "确认打款" : "退回申请"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <AppShell>
      <PaymentInner />
    </AppShell>
  );
}
