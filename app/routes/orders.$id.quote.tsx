import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { requireRole } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { Role, WorkOrderStatus, AlertType, AlertStatus } from "~/utils/constants";
import { Button, Card, Input, Label, Textarea } from "~/components/ui";
import { z } from "zod";
import { formatCurrency } from "~/utils/misc";

export const meta: MetaFunction = () => [
  { title: "填写检测报价 - 手机维修店管理系统" },
];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const user = await requireRole(request, [Role.TECHNICIAN]);
  if (!params.id) throw new Response("Not Found", { status: 404 });

  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      inspectionQuote: {
        include: { parts: true },
      },
    },
  });

  if (!order) throw new Response("Not Found", { status: 404 });

  if (order.assignedTechnicianId !== user.id) {
    return redirect(`/orders/${order.id}`);
  }

  if (
    order.status !== WorkOrderStatus.INSPECTION_IN_PROGRESS &&
    order.status !== WorkOrderStatus.CUSTOMER_REJECTED
  ) {
    return redirect(`/orders/${order.id}`);
  }

  return json({ order, user });
};

const PartSchema = z.object({
  partName: z.string().min(1),
  partNumber: z.string().optional(),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  inStock: z.enum(["true", "false"]).default("true"),
  stockLocation: z.string().optional(),
  notes: z.string().optional(),
});

const QuoteSchema = z.object({
  faultDiagnosis: z.string().min(1, "故障诊断必填"),
  keyJudgments: z.string().min(1, "关键判断必填，这是客户确认时展示的重要依据"),
  repairSolution: z.string().min(1, "维修方案必填"),
  estimatedDuration: z.string().min(1, "预计耗时必填"),
  riskWarning: z.string().optional(),
  laborCost: z.coerce.number().min(0, "人工费不能为负"),
  parts: z.array(PartSchema).optional(),
  hasAbnormal: z.enum(["true", "false"]).default("false"),
  abnormalNote: z.string().optional(),
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireRole(request, [Role.TECHNICIAN]);
  if (!params.id) throw new Response("Not Found", { status: 404 });

  const form = await request.formData();

  const partsRaw: Record<string, any>[] = [];
  let partIdx = 0;
  while (form.get(`parts[${partIdx}].partName`) !== null) {
    partsRaw.push({
      partName: form.get(`parts[${partIdx}].partName`),
      partNumber: form.get(`parts[${partIdx}].partNumber`) || undefined,
      quantity: form.get(`parts[${partIdx}].quantity`) || 1,
      unitPrice: form.get(`parts[${partIdx}].unitPrice`) || 0,
      inStock: form.get(`parts[${partIdx}].inStock`) || "true",
      stockLocation: form.get(`parts[${partIdx}].stockLocation`) || undefined,
      notes: form.get(`parts[${partIdx}].notes`) || undefined,
    });
    partIdx++;
  }

  const validated = QuoteSchema.safeParse({
    faultDiagnosis: form.get("faultDiagnosis"),
    keyJudgments: form.get("keyJudgments"),
    repairSolution: form.get("repairSolution"),
    estimatedDuration: form.get("estimatedDuration"),
    riskWarning: form.get("riskWarning") || undefined,
    laborCost: form.get("laborCost") || 0,
    parts: partsRaw,
    hasAbnormal: form.get("hasAbnormal") || "false",
    abnormalNote: form.get("abnormalNote") || undefined,
  });

  if (!validated.success) {
    return json(
      { errors: validated.error.flatten().fieldErrors, ok: false },
      { status: 400 }
    );
  }

  const order = await prisma.workOrder.findUnique({ where: { id: params.id } });
  if (!order) throw new Response("Not Found", { status: 404 });

  const parts = validated.data.parts || [];
  const partsTotal = parts.reduce(
    (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
    0
  );
  const totalAmount = Number(validated.data.laborCost) + partsTotal;

  const prevQuote = await prisma.inspectionQuote.findUnique({
    where: { workOrderId: order.id },
  });

  if (prevQuote) {
    await prisma.quotePart.deleteMany({ where: { inspectionQuoteId: prevQuote.id } });
    await prisma.inspectionQuote.delete({ where: { id: prevQuote.id } });
  }

  await prisma.workOrder.update({
    where: { id: order.id },
    data: {
      status: WorkOrderStatus.QUOTE_READY,
      inspectionQuote: {
        create: {
          faultDiagnosis: validated.data.faultDiagnosis,
          keyJudgments: validated.data.keyJudgments,
          repairSolution: validated.data.repairSolution,
          estimatedDuration: validated.data.estimatedDuration,
          riskWarning: validated.data.riskWarning,
          laborCost: Number(validated.data.laborCost),
          partsTotal,
          totalAmount,
          createdById: user.id,
          parts: {
            create: parts.map((p) => ({
              partName: p.partName,
              partNumber: p.partNumber,
              quantity: Number(p.quantity),
              unitPrice: Number(p.unitPrice),
              inStock: p.inStock === "true",
              stockLocation: p.stockLocation,
              notes: p.notes,
            })),
          },
        },
      },
      timelineEvents: {
        create: {
          fromStatus: order.status,
          toStatus: WorkOrderStatus.QUOTE_READY,
          eventType: validated.data.hasAbnormal === "true" ? "QUOTE_CREATED_ABNORMAL" : "QUOTE_CREATED",
          description:
            validated.data.hasAbnormal === "true"
              ? `维修师完成检测（检测存在异常：${validated.data.abnormalNote || "详见报价"}），已提交报价单，等待客户确认。`
              : "维修师完成检测，已提交报价单，等待客户确认。",
          responsibleId: user.id,
        },
      },
      ...(validated.data.hasAbnormal === "true"
        ? {
            alerts: {
              create: {
                alertType: AlertType.ABNORMAL_DETECTION,
                title: "检测结果异常",
                message: `工单 ${order.orderNo} 检测存在异常：${validated.data.abnormalNote || "详见报价单"}。请店长关注并确认是否继续。`,
                status: AlertStatus.ACTIVE,
              },
            },
          }
        : {}),
    },
  });

  return redirect(`/orders/${order.id}`);
};

export default function QuotePage() {
  const { order } = useLoaderData<typeof loader>();
  const actionData = useFetcher<typeof action>();
  const [parts, setParts] = useState<any[]>(
    order.inspectionQuote?.parts?.length
      ? order.inspectionQuote.parts
      : [{ partName: "", partNumber: "", quantity: 1, unitPrice: 0, inStock: "true", stockLocation: "", notes: "" }]
  );
  const [laborCost, setLaborCost] = useState<number>(order.inspectionQuote?.laborCost || 0);
  const [hasAbnormal, setHasAbnormal] = useState(false);

  const partsTotal = parts.reduce(
    (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
    0
  );
  const totalAmount = Number(laborCost) + partsTotal;

  const updatePart = (idx: number, field: string, value: any) => {
    setParts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addPart = () => {
    setParts((prev) => [
      ...prev,
      { partName: "", partNumber: "", quantity: 1, unitPrice: 0, inStock: "true", stockLocation: "", notes: "" },
    ]);
  };

  const removePart = (idx: number) => {
    setParts((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/orders/${order.id}`} className="text-sm text-slate-500 hover:text-slate-700">
            ← 返回工单详情
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            填写检测报价 · {order.orderNo}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {order.deviceBrand} {order.deviceModel} - {order.customerName} - {order.faultDescription}
          </p>
        </div>
      </div>

      <Form method="post">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card
              title="故障诊断与关键判断"
              subtitle="关键判断将在客户确认页面重点展示，是一线同事沟通的核心依据"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="faultDiagnosis" required>故障诊断</Label>
                  <Textarea
                    id="faultDiagnosis"
                    name="faultDiagnosis"
                    rows={3}
                    placeholder="描述检测发现的具体故障原因..."
                    defaultValue={order.inspectionQuote?.faultDiagnosis}
                  />
                  {actionData.data?.errors?.faultDiagnosis && (
                    <p className="mt-1 text-xs text-red-600">{actionData.data.errors.faultDiagnosis[0]}</p>
                  )}
                </div>

                <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50">
                  <Label htmlFor="keyJudgments" required>
                    关键判断 <span className="text-xs font-normal text-blue-700">（客户确认时重点展示，请务必写清楚推理过程）</span>
                  </Label>
                  <Textarea
                    id="keyJudgments"
                    name="keyJudgments"
                    rows={4}
                    placeholder="1. xxx；\n2. xxx；\n3. 结论..."
                    defaultValue={order.inspectionQuote?.keyJudgments}
                    className="bg-white"
                  />
                  {actionData.data?.errors?.keyJudgments && (
                    <p className="mt-1 text-xs text-red-600">{actionData.data.errors.keyJudgments[0]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="repairSolution" required>维修方案</Label>
                  <Textarea
                    id="repairSolution"
                    name="repairSolution"
                    rows={2}
                    placeholder="具体的维修操作方案..."
                    defaultValue={order.inspectionQuote?.repairSolution}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="estimatedDuration" required>预计耗时</Label>
                    <Input
                      id="estimatedDuration"
                      name="estimatedDuration"
                      placeholder="约 30 分钟"
                      defaultValue={order.inspectionQuote?.estimatedDuration}
                    />
                  </div>
                  <div>
                    <Label htmlFor="riskWarning">风险提示</Label>
                    <Input
                      id="riskWarning"
                      name="riskWarning"
                      placeholder="如有风险请填写"
                      defaultValue={order.inspectionQuote?.riskWarning || ""}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="备件清单"
              action={
                <Button type="button" variant="secondary" size="sm" onClick={addPart}>
                  + 添加备件
                </Button>
              }
            >
              <div className="space-y-3">
                {parts.map((p, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 items-end"
                  >
                    <div className="col-span-3">
                      <Label className="text-xs">备件名称</Label>
                      <Input
                        name={`parts[${idx}].partName`}
                        placeholder="如：原装电池"
                        size={undefined as any}
                        value={p.partName}
                        onChange={(e) => updatePart(idx, "partName", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">型号</Label>
                      <Input
                        name={`parts[${idx}].partNumber`}
                        placeholder="可选"
                        value={p.partNumber}
                        onChange={(e) => updatePart(idx, "partNumber", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">数量</Label>
                      <Input
                        name={`parts[${idx}].quantity`}
                        type="number"
                        min={1}
                        value={p.quantity}
                        onChange={(e) => updatePart(idx, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">单价(元)</Label>
                      <Input
                        name={`parts[${idx}].unitPrice`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={p.unitPrice}
                        onChange={(e) => updatePart(idx, "unitPrice", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">库存位置</Label>
                      <Input
                        name={`parts[${idx}].stockLocation`}
                        placeholder="如：A-01-02"
                        value={p.stockLocation}
                        onChange={(e) => updatePart(idx, "stockLocation", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          name={`parts[${idx}].inStock`}
                          value="true"
                          defaultChecked={p.inStock === "true" || p.inStock === true}
                          className="rounded border-slate-300"
                        />
                        <label className="text-xs text-slate-600">有货</label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePart(idx)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
                {parts.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    无备件需求可留空
                  </p>
                )}
              </div>
            </Card>

            <Card title="异常情况上报" subtitle="如检测发现进水、严重损坏、数据丢失风险等，请勾选并说明，将自动触发店长提醒">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasAbnormal"
                    value="true"
                    checked={hasAbnormal}
                    onChange={(e) => setHasAbnormal(e.target.checked)}
                    className="rounded border-slate-300 text-red-600"
                  />
                  <span className="text-sm font-medium text-slate-700">本次检测存在异常情况</span>
                </label>
                {hasAbnormal && (
                  <div>
                    <Label htmlFor="abnormalNote" required>异常说明</Label>
                    <Textarea
                      id="abnormalNote"
                      name="abnormalNote"
                      rows={2}
                      placeholder="请详细描述异常情况、影响范围、客户沟通建议等..."
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="费用汇总" className="sticky top-24">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="laborCost" required>人工费 (元)</Label>
                  <Input
                    id="laborCost"
                    name="laborCost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Number(e.target.value))}
                    defaultValue={order.inspectionQuote?.laborCost}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">备件费</span>
                  <span className="text-slate-900">{formatCurrency(partsTotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-3 border-t border-slate-200">
                  <span className="text-slate-900">合计报价</span>
                  <span className="text-blue-700">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Button type="submit" className="w-full" size="lg">
                提交报价，转客户确认
              </Button>
              <Link to={`/orders/${order.id}`} className="block text-center">
                <Button variant="secondary" className="w-full">取消</Button>
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 mb-1">提交后：</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>工单状态变为「报价待确认」</li>
                <li>责任转移至前台/店长跟进客户</li>
                <li>前台确认时会看到你填写的关键判断</li>
                <li>如勾选异常，自动向店长发送提醒</li>
              </ul>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
