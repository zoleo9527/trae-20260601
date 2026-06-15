import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import {
  WorkOrderStatusLabel,
  WorkOrderStatusColor,
  ConfirmationDecisionLabel,
  RoleLabel,
  RoleColor,
} from "~/utils/constants";
import { formatDateTime, formatCurrency } from "~/utils/misc";
import { Card, StatusBadge } from "~/components/ui";

export const meta: MetaFunction = () => [
  { title: "客户确认回看 - 手机维修店管理系统" },
];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  if (!params.id) throw new Response("Not Found", { status: 404 });

  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      inspectionQuote: {
        include: {
          parts: true,
          createdBy: { select: { id: true, name: true, role: true } },
        },
      },
      customerConfirmation: {
        include: {
          confirmedBy: { select: { id: true, name: true, role: true } },
        },
      },
      timelineEvents: {
        include: {
          responsible: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) throw new Response("Not Found", { status: 404 });
  if (!order.customerConfirmation) {
    return redirect(`/orders/${order.id}`);
  }

  return json({ order });
};

export default function ReviewPage() {
  const { order } = useLoaderData<typeof loader>();
  const confirm = order.customerConfirmation!;
  const quote = order.inspectionQuote;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <Link to={`/orders/${order.id}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回工单详情
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          客户确认记录回看
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          工单 {order.orderNo} · 状态：
          <StatusBadge
            status={order.status}
            colorMap={WorkOrderStatusColor}
            labelMap={WorkOrderStatusLabel}
          />
        </p>
      </div>

      <Card title="客户确认决策">
        <div className="grid md:grid-cols-2 gap-4">
          <InfoRow
            label="确认结果"
            value={
              <span
                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${
                  confirm.decision === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : confirm.decision === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {ConfirmationDecisionLabel[confirm.decision] || confirm.decision}
              </span>
            }
          />
          <InfoRow label="确认时间" value={formatDateTime(confirm.confirmedAt)} />
          <InfoRow label="客户姓名" value={confirm.customerName} />
          <InfoRow label="客户电话" value={confirm.customerPhone} />
          <InfoRow label="客户签名/确认码" value={confirm.customerSignature || "（已电子确认）"} />
          <InfoRow
            label="办理前台"
            value={
              <span>
                {confirm.confirmedBy.name}
                <span
                  className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${RoleColor[confirm.confirmedBy.role]}`}
                >
                  {RoleLabel[confirm.confirmedBy.role]}
                </span>
              </span>
            }
          />
        </div>
        {confirm.rejectReason && (
          <div className="mt-4 p-3 rounded bg-red-50 border border-red-200">
            <p className="text-xs font-semibold text-red-700 mb-1">拒绝原因：</p>
            <p className="text-sm text-red-800 whitespace-pre-line">{confirm.rejectReason}</p>
          </div>
        )}
        {confirm.reviseNotes && (
          <div className="mt-4 p-3 rounded bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-700 mb-1">修改意见：</p>
            <p className="text-sm text-amber-800 whitespace-pre-line">{confirm.reviseNotes}</p>
          </div>
        )}
      </Card>

      {quote && (
        <Card
          title="当时展示给客户的报价单"
          subtitle={`由 ${quote.createdBy.name} 于 ${formatDateTime(quote.createdAt)} 创建`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50">
              <p className="text-xs font-semibold text-blue-700 mb-1">📋 当时向客户讲解的关键判断</p>
              <p className="text-sm text-blue-900 whitespace-pre-line leading-relaxed font-medium">
                {quote.keyJudgments}
              </p>
            </div>

            <InfoSection label="故障诊断" value={quote.faultDiagnosis} />
            <InfoSection label="维修方案" value={quote.repairSolution} />
            <InfoSection label="预计耗时" value={quote.estimatedDuration} />
            {quote.riskWarning && <InfoSection label="风险提示" value={quote.riskWarning} danger />}

            {quote.parts.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">备件</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">数量</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">单价</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quote.parts.map((p: any) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-sm text-slate-900">{p.partName}</td>
                        <td className="px-3 py-2 text-sm text-slate-700 text-center">{p.quantity}</td>
                        <td className="px-3 py-2 text-sm text-slate-700 text-right">
                          {formatCurrency(p.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-slate-900 text-right">
                          {formatCurrency(p.quantity * p.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end">
              <div className="w-64 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">人工费</span>
                  <span>{formatCurrency(quote.laborCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">备件费</span>
                  <span>{formatCurrency(quote.partsTotal)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
                  <span>当时报价合计</span>
                  <span className="text-blue-700">{formatCurrency(quote.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card title="完整操作时间线">
        <ol className="relative border-l-2 border-slate-200 ml-3">
          {order.timelineEvents.map((event: any) => (
            <li key={event.id} className="mb-5 ml-6">
              <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-500">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </span>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge
                      status={event.toStatus}
                      colorMap={WorkOrderStatusColor}
                      labelMap={WorkOrderStatusLabel}
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {event.responsible.name}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${RoleColor[event.responsible.role]}`}
                    >
                      {RoleLabel[event.responsible.role]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{event.description}</p>
                </div>
                <p className="text-xs text-slate-500 shrink-0">{formatDateTime(event.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}

function InfoSection({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        danger ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
      }`}
    >
      <p className={`text-xs font-semibold mb-1 ${danger ? "text-red-700" : "text-slate-600"}`}>
        {label}
      </p>
      <p
        className={`text-sm whitespace-pre-line leading-relaxed ${
          danger ? "text-red-900" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
