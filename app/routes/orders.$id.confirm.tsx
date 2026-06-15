import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData } from "@remix-run/react";
import { useState } from "react";
import { requireRole } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import {
  Role,
  WorkOrderStatus,
  ConfirmationDecision,
  AlertType,
  AlertStatus,
} from "~/utils/constants";
import { Button, Card, Input, Label, Textarea, Select } from "~/components/ui";
import { formatCurrency } from "~/utils/misc";
import { z } from "zod";

export const meta: MetaFunction = () => [
  { title: "客户确认 - 手机维修店管理系统" },
];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const user = await requireRole(request, [Role.RECEPTIONIST, Role.MANAGER]);
  if (!params.id) throw new Response("Not Found", { status: 404 });

  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      inspectionQuotes: {
        where: { isCurrent: true },
        include: {
          parts: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { version: "desc" },
        take: 1,
      },
      customerConfirmations: {
        where: { isCurrent: true },
        orderBy: { version: "desc" },
        take: 1,
      },
      assignedTechnician: { select: { id: true, name: true } },
    },
  });

  if (!order) throw new Response("Not Found", { status: 404 });

  const currentQuote = order.inspectionQuotes[0] || null;
  const currentConfirmation = order.customerConfirmations[0] || null;

  if (!currentQuote || order.status !== WorkOrderStatus.QUOTE_READY) {
    return redirect(`/orders/${order.id}`);
  }

  return json({
    order: { ...order, inspectionQuote: currentQuote, customerConfirmation: currentConfirmation },
    user,
  });
};

const ConfirmSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "REVISE_NEEDED"], {
    required_error: "请选择客户决定",
  }),
  customerName: z.string().min(1, "客户姓名必填"),
  customerPhone: z.string().min(1, "客户电话必填"),
  customerSignature: z.string().optional(),
  rejectReason: z.string().optional(),
  reviseNotes: z.string().optional(),
}).refine(
  (data) => {
    if (data.decision === "REJECTED") {
      return !!data.rejectReason && data.rejectReason.trim().length > 0;
    }
    return true;
  },
  {
    message: "请填写拒绝原因",
    path: ["rejectReason"],
  }
).refine(
  (data) => {
    if (data.decision === "REVISE_NEEDED") {
      return !!data.reviseNotes && data.reviseNotes.trim().length > 0;
    }
    return true;
  },
  {
    message: "请填写客户修改意见",
    path: ["reviseNotes"],
  }
);

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireRole(request, [Role.RECEPTIONIST, Role.MANAGER]);
  if (!params.id) throw new Response("Not Found", { status: 404 });

  const form = await request.formData();
  const validated = ConfirmSchema.safeParse({
    decision: form.get("decision"),
    customerName: form.get("customerName"),
    customerPhone: form.get("customerPhone"),
    customerSignature: form.get("customerSignature") || undefined,
    rejectReason: form.get("rejectReason") || undefined,
    reviseNotes: form.get("reviseNotes") || undefined,
  });

  if (!validated.success) {
    return json(
      { errors: validated.error.flatten().fieldErrors, ok: false },
      { status: 400 }
    );
  }

  const order = await prisma.workOrder.findUnique({ where: { id: params.id } });
  if (!order) throw new Response("Not Found", { status: 404 });

  const prevConfirmation = await prisma.customerConfirmation.findFirst({
    where: { workOrderId: order.id, isCurrent: true },
    orderBy: { version: "desc" },
  });

  const nextVersion = prevConfirmation ? prevConfirmation.version + 1 : 1;

  if (prevConfirmation) {
    await prisma.customerConfirmation.updateMany({
      where: { workOrderId: order.id, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const newStatus =
    validated.data.decision === "APPROVED"
      ? WorkOrderStatus.CUSTOMER_CONFIRMED
      : validated.data.decision === "REJECTED"
      ? WorkOrderStatus.CUSTOMER_REJECTED
      : WorkOrderStatus.REVISE_REQUESTED;

  const descriptionMap: Record<string, string> = {
    APPROVED: "客户签字确认同意维修方案及报价。",
    REJECTED: `客户拒绝维修。原因：${validated.data.rejectReason || "未填写"}`,
    REVISE_NEEDED: `客户要求修改报价。意见：${validated.data.reviseNotes || "未填写"}`,
  };

  await prisma.workOrder.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      customerConfirmations: {
        create: {
          version: nextVersion,
          isCurrent: true,
          decision: validated.data.decision,
          customerName: validated.data.customerName,
          customerPhone: validated.data.customerPhone,
          customerSignature: validated.data.customerSignature,
          rejectReason: validated.data.rejectReason,
          reviseNotes: validated.data.reviseNotes,
          confirmedById: user.id,
        },
      },
      timelineEvents: {
        create: {
          fromStatus: order.status,
          toStatus: newStatus,
          eventType:
            validated.data.decision === "APPROVED"
              ? "CUSTOMER_APPROVED"
              : validated.data.decision === "REJECTED"
              ? "CUSTOMER_REJECTED"
              : "CUSTOMER_REVISE",
          description: `第 ${nextVersion} 次确认 - ${descriptionMap[validated.data.decision]}`,
          responsibleId: user.id,
        },
      },
      ...(validated.data.decision === "REJECTED"
        ? {
            alerts: {
              create: {
                alertType: AlertType.CUSTOMER_REJECTED_ALERT,
                title: "客户拒绝报价",
                message: `工单 ${order.orderNo} 客户已拒绝维修，原因：${validated.data.rejectReason || "未填写原因"}。请安排设备退回。`,
                status: AlertStatus.ACTIVE,
              },
            },
          }
        : {}),
      ...(validated.data.decision === "REVISE_NEEDED" && order.assignedTechnicianId
        ? {
            alerts: {
              create: {
                alertType: AlertType.REVISE_REQUESTED,
                title: "客户要求修改报价",
                message: `工单 ${order.orderNo} 客户要求修改报价（第 ${nextVersion} 次），意见：${validated.data.reviseNotes || "未填写"}。请维修师重新检测报价。`,
                status: AlertStatus.ACTIVE,
                assignedToId: order.assignedTechnicianId,
              },
            },
          }
        : {}),
    },
  });

  return redirect(`/orders/${order.id}`);
};

export default function ConfirmPage() {
  const { order } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const quote = order.inspectionQuote!;
  const [decision, setDecision] = useState<string>("");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/orders/${order.id}`} className="text-sm text-slate-500 hover:text-slate-700">
            ← 返回工单详情
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            客户确认 · {order.orderNo}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {order.deviceBrand} {order.deviceModel} · {order.customerName} · {quote.createdBy.name} 已完成检测
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card
            title="维修师关键判断"
            subtitle="以下内容由维修师填写，是与客户沟通的核心依据，务必重点讲解"
            className="border-2 border-blue-300 bg-blue-50/30"
          >
            <div className="rounded-lg border-2 border-blue-200 bg-white p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                ⚠️ 客户确认时必须向客户说明以下关键判断
              </p>
              <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                {quote.keyJudgments}
              </p>
            </div>
          </Card>

          <Card title="故障诊断与维修方案">
            <div className="space-y-3">
              <InfoSection label="故障诊断" value={quote.faultDiagnosis} />
              <InfoSection label="维修方案" value={quote.repairSolution} />
              <InfoSection label="预计耗时" value={quote.estimatedDuration} />
              {quote.riskWarning && (
                <div className="p-3 rounded border-2 border-red-200 bg-red-50">
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠️ 风险提示（必须告知客户）：</p>
                  <p className="text-sm text-red-900 whitespace-pre-line leading-relaxed">
                    {quote.riskWarning}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {quote.parts.length > 0 && (
            <Card title="备件清单">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">备件名称</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">型号</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">数量</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">单价</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">小计</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">库存</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quote.parts.map((p: any) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-sm text-slate-900">{p.partName}</td>
                        <td className="px-3 py-2 text-sm text-slate-500">{p.partNumber || "-"}</td>
                        <td className="px-3 py-2 text-sm text-slate-700 text-center">{p.quantity}</td>
                        <td className="px-3 py-2 text-sm text-slate-700 text-right">
                          {formatCurrency(p.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-900 font-medium text-right">
                          {formatCurrency(p.quantity * p.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {p.inStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              有货 {p.stockLocation}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              缺货
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card title="费用明细">
            <div className="space-y-2 w-full md:w-80 ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">人工费</span>
                <span className="text-slate-900">{formatCurrency(quote.laborCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">备件费</span>
                <span className="text-slate-900">{formatCurrency(quote.partsTotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-slate-200">
                <span className="text-slate-900">合计报价</span>
                <span className="text-blue-700">{formatCurrency(quote.totalAmount)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="客户确认决策" className="sticky top-24">
            <Form method="post" className="space-y-4">
              <div>
                <Label required>客户决定</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      value: ConfirmationDecision.APPROVED,
                      label: "✓ 同意维修",
                      desc: "客户认可报价，开始维修",
                      color: "border-green-300 bg-green-50 checked:border-green-500",
                    },
                    {
                      value: ConfirmationDecision.REJECTED,
                      label: "✗ 拒绝维修",
                      desc: "客户不修了，退回设备",
                      color: "border-red-300 bg-red-50 checked:border-red-500",
                    },
                    {
                      value: ConfirmationDecision.REVISE_NEEDED,
                      label: "↻ 需要修改报价",
                      desc: "退回维修师重新报价",
                      color: "border-amber-300 bg-amber-50 checked:border-amber-500",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        decision === opt.value
                          ? opt.color + " ring-2 ring-offset-1 ring-blue-500"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        value={opt.value}
                        checked={decision === opt.value}
                        onChange={(e) => setDecision(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {actionData?.errors?.decision && (
                  <p className="mt-1 text-xs text-red-600">{actionData.errors.decision[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customerName" required>客户姓名</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    defaultValue={order.customerName}
                  />
                  {actionData?.errors?.customerName && (
                    <p className="mt-1 text-xs text-red-600">{actionData.errors.customerName[0]}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerPhone" required>联系电话</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    defaultValue={order.customerPhone}
                  />
                  {actionData?.errors?.customerPhone && (
                    <p className="mt-1 text-xs text-red-600">{actionData.errors.customerPhone[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="customerSignature">客户电子签名/确认码</Label>
                <Input
                  id="customerSignature"
                  name="customerSignature"
                  placeholder="客户姓名拼音/手机号后四位"
                />
              </div>

              {decision === ConfirmationDecision.REJECTED && (
                <div className="p-3 rounded border-2 border-red-200 bg-red-50">
                  <Label htmlFor="rejectReason" required className="text-red-800">
                    拒绝原因
                  </Label>
                  <Textarea
                    id="rejectReason"
                    name="rejectReason"
                    rows={3}
                    placeholder="请详细记录客户拒绝的原因..."
                    className="bg-white"
                  />
                  {actionData?.errors?.rejectReason && (
                    <p className="mt-1 text-xs text-red-600">{actionData.errors.rejectReason[0]}</p>
                  )}
                  <p className="text-xs text-red-600 mt-2">
                    提交后将自动向店长发送异常提醒，并记录责任转移
                  </p>
                </div>
              )}

              {decision === ConfirmationDecision.REVISE_NEEDED && (
                <div className="p-3 rounded border-2 border-amber-200 bg-amber-50">
                  <Label htmlFor="reviseNotes" required className="text-amber-800">
                    修改意见
                  </Label>
                  <Textarea
                    id="reviseNotes"
                    name="reviseNotes"
                    rows={3}
                    placeholder="请详细记录客户要求修改的内容..."
                    className="bg-white"
                  />
                  {actionData?.errors?.reviseNotes && (
                    <p className="mt-1 text-xs text-red-600">{actionData.errors.reviseNotes[0]}</p>
                  )}
                  <p className="text-xs text-amber-700 mt-2">
                    提交后工单将退回「需修改报价」状态，并自动提醒负责的维修师
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Button type="submit" className="w-full" size="lg" disabled={!decision}>
                  确认并提交
                </Button>
                <Link to={`/orders/${order.id}`} className="block text-center">
                  <Button variant="secondary" className="w-full">取消</Button>
                </Link>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-1">提交后责任转移：</p>
                <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
                  <li>同意 → 维修师（{order.assignedTechnician?.name || "待分配"}）负责开始维修</li>
                  <li>拒绝 → 店长跟进设备退回处理</li>
                  <li>修改 → 维修师（{order.assignedTechnician?.name || "待分配"}）重新报价</li>
                </ul>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{value}</p>
    </div>
  );
}
