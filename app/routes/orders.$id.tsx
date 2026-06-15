import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useParams } from "@remix-run/react";
import { requireUserId, getUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import {
  WorkOrderStatus,
  WorkOrderStatusLabel,
  WorkOrderStatusColor,
  RoleLabel,
  RoleColor,
  Role,
  ConfirmationDecisionLabel,
} from "~/utils/constants";
import {
  formatDateTime,
  formatCurrency,
  formatDate,
  cn,
} from "~/utils/misc";
import { Button, Card, StatusBadge } from "~/components/ui";
import { Timeline } from "~/components/Timeline";

export const meta: MetaFunction = () => [
  { title: "工单详情 - 手机维修店管理系统" },
];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  const user = await getUser(request);
  if (!params.id) throw new Response("Not Found", { status: 404 });

  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      receivedBy: { select: { id: true, name: true, role: true } },
      assignedTechnician: { select: { id: true, name: true, role: true } },
      inspectionQuote: {
        include: {
          parts: true,
          photos: true,
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
      alerts: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) throw new Response("Not Found", { status: 404 });

  const technicians = await prisma.user.findMany({
    where: { role: Role.TECHNICIAN },
    select: { id: true, name: true },
  });

  return json({ order, user, technicians });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserId(request);
  if (!params.id) throw new Response("Not Found", { status: 404 });
  const form = await request.formData();
  const intent = form.get("intent");

  const order = await prisma.workOrder.findUnique({ where: { id: params.id } });
  if (!order) throw new Response("Not Found", { status: 404 });

  if (intent === "assign" && (user.role === Role.RECEPTIONIST || user.role === Role.MANAGER)) {
    const technicianId = form.get("technicianId") as string;
    if (!technicianId) return json({ error: "请选择维修师" }, { status: 400 });
    const technician = await prisma.user.findUnique({ where: { id: technicianId } });
    if (!technician) return json({ error: "维修师不存在" }, { status: 400 });

    await prisma.workOrder.update({
      where: { id: order.id },
      data: {
        assignedTechnicianId: technician.id,
        technicianAssignedAt: new Date(),
        status: WorkOrderStatus.INSPECTION_IN_PROGRESS,
        timelineEvents: {
          create: {
            fromStatus: order.status,
            toStatus: WorkOrderStatus.INSPECTION_IN_PROGRESS,
            eventType: "ASSIGNED",
            description: `工单分配给维修师 ${technician.name}，开始检测。`,
            responsibleId: user.id,
          },
        },
      },
    });
    return redirect(`/orders/${order.id}`);
  }

  if (intent === "start-repair" && user.role === Role.TECHNICIAN) {
    if (order.status !== WorkOrderStatus.CUSTOMER_CONFIRMED) {
      return json({ error: "状态不允许" }, { status: 400 });
    }
    await prisma.workOrder.update({
      where: { id: order.id },
      data: {
        status: WorkOrderStatus.REPAIR_IN_PROGRESS,
        timelineEvents: {
          create: {
            fromStatus: order.status,
            toStatus: WorkOrderStatus.REPAIR_IN_PROGRESS,
            eventType: "REPAIR_STARTED",
            description: "维修师已开始维修作业。",
            responsibleId: user.id,
          },
        },
      },
    });
    return redirect(`/orders/${order.id}`);
  }

  if (intent === "complete" && user.role === Role.TECHNICIAN) {
    if (order.status !== WorkOrderStatus.REPAIR_IN_PROGRESS) {
      return json({ error: "状态不允许" }, { status: 400 });
    }
    await prisma.workOrder.update({
      where: { id: order.id },
      data: {
        status: WorkOrderStatus.COMPLETED,
        timelineEvents: {
          create: {
            fromStatus: order.status,
            toStatus: WorkOrderStatus.COMPLETED,
            eventType: "REPAIR_COMPLETED",
            description: "维修完成，质检通过，等待客户取机。",
            responsibleId: user.id,
          },
        },
      },
    });
    return redirect(`/orders/${order.id}`);
  }

  return json({ error: "未知操作" }, { status: 400 });
};

export default function OrderDetail() {
  const { order, user, technicians } = useLoaderData<typeof loader>();
  const params = useParams();
  if (!user) return null;

  const showAssign =
    (user.role === Role.RECEPTIONIST || user.role === Role.MANAGER) &&
    order.status === WorkOrderStatus.PENDING_INSPECTION;

  const showQuoteButton =
    user.role === Role.TECHNICIAN &&
    order.assignedTechnician?.id === user.id &&
    order.status === WorkOrderStatus.INSPECTION_IN_PROGRESS;

  const showConfirmButton =
    (user.role === Role.RECEPTIONIST || user.role === Role.MANAGER) &&
    order.status === WorkOrderStatus.QUOTE_READY;

  const showReviewButton =
    (user.role === Role.RECEPTIONIST || user.role === Role.MANAGER) &&
    (order.status === WorkOrderStatus.CUSTOMER_CONFIRMED ||
      order.status === WorkOrderStatus.CUSTOMER_REJECTED);

  const showStartRepair =
    user.role === Role.TECHNICIAN &&
    order.assignedTechnician?.id === user.id &&
    order.status === WorkOrderStatus.CUSTOMER_CONFIRMED;

  const showComplete =
    user.role === Role.TECHNICIAN &&
    order.assignedTechnician?.id === user.id &&
    order.status === WorkOrderStatus.REPAIR_IN_PROGRESS;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← 返回工单列表
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            工单 {order.orderNo}
          </h1>
          <StatusBadge
            status={order.status}
            colorMap={WorkOrderStatusColor}
            labelMap={WorkOrderStatusLabel}
          />
        </div>
        <div className="flex items-center gap-2">
          {showReviewButton && (
            <Link to={`/orders/${order.id}/review`}>
              <Button variant="secondary">查看客户确认记录</Button>
            </Link>
          )}
          {showQuoteButton && (
            <Link to={`/orders/${order.id}/quote`}>
              <Button>填写检测报价</Button>
            </Link>
          )}
          {showConfirmButton && (
            <Link to={`/orders/${order.id}/confirm`}>
              <Button>联系客户确认</Button>
            </Link>
          )}
          {showStartRepair && (
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="start-repair" />
              <Button type="submit">开始维修</Button>
            </Form>
          )}
          {showComplete && (
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="complete" />
              <Button variant="primary">维修完成</Button>
            </Form>
          )}
        </div>
      </div>

      {order.alerts.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-sm shrink-0">!</div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800">
                该工单存在 {order.alerts.length} 条异常提醒
              </h4>
              <div className="mt-2 space-y-1.5">
                {order.alerts.map((a) => (
                  <div key={a.id} className="text-sm text-red-700">
                    <span className="font-medium">{a.title}：</span>
                    {a.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="客户与设备信息">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow label="客户姓名" value={order.customerName} />
              <InfoRow label="联系电话" value={order.customerPhone} />
              <InfoRow label="设备品牌" value={order.deviceBrand} />
              <InfoRow label="设备型号" value={order.deviceModel} />
              <InfoRow label="设备颜色" value={order.deviceColor || "-"} />
              <InfoRow label="IMEI/序列号" value={order.deviceImei || "-"} />
              <InfoRow label="接机时间" value={formatDateTime(order.receivedAt)} />
              <InfoRow
                label="接机人"
                value={
                  order.receivedBy ? (
                    <span>
                      {order.receivedBy.name}
                      <span
                        className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${RoleColor[order.receivedBy.role]}`}
                      >
                        {RoleLabel[order.receivedBy.role]}
                      </span>
                    </span>
                  ) : (
                    "-"
                  )
                }
              />
              <InfoRow label="故障描述" value={order.faultDescription} full />
              <InfoRow label="外观备注" value={order.appearanceNotes || "-"} full />
              <InfoRow label="附件清单" value={order.accessoryItems || "-"} full />
            </div>
          </Card>

          {showAssign && (
            <Card title="分配维修师" subtitle="分配后工单将进入「检测中」状态，责任转移至维修师">
              <Form method="post" className="flex items-end gap-3">
                <input type="hidden" name="intent" value="assign" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    选择维修师 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="technicianId"
                    className="block w-full rounded-md border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 outline-none bg-white"
                    defaultValue=""
                  >
                    <option value="">请选择维修师...</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit">确认分配</Button>
              </Form>
            </Card>
          )}

          {order.assignedTechnician && (
            <Card title="责任分配">
              <div className="grid md:grid-cols-2 gap-4">
                <InfoRow
                  label="当前负责维修师"
                  value={
                    <div>
                      <span className="font-medium text-slate-900">
                        {order.assignedTechnician.name}
                      </span>
                      <span
                        className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${RoleColor[order.assignedTechnician.role]}`}
                      >
                        {RoleLabel[order.assignedTechnician.role]}
                      </span>
                    </div>
                  }
                />
                <InfoRow
                  label="分配时间"
                  value={order.technicianAssignedAt ? formatDateTime(order.technicianAssignedAt) : "-"}
                />
              </div>
              <div className="mt-3 p-3 rounded bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">责任说明：</span>
                  工单状态和责任人在每次操作时同步更新，时间线全程留痕，
                  不会出现无人负责的空档期。
                </p>
              </div>
            </Card>
          )}

          {order.inspectionQuote && (
            <Card title="检测报价单" subtitle={`由 ${order.inspectionQuote.createdBy.name} 于 ${formatDateTime(order.inspectionQuote.createdAt)} 创建`}>
              <div className="space-y-4">
                <InfoBlock label="故障诊断" value={order.inspectionQuote.faultDiagnosis} />
                <InfoBlock
                  label="关键判断"
                  value={order.inspectionQuote.keyJudgments}
                  highlight
                />
                <InfoBlock label="维修方案" value={order.inspectionQuote.repairSolution} />
                <InfoBlock label="预计耗时" value={order.inspectionQuote.estimatedDuration} />
                {order.inspectionQuote.riskWarning && (
                  <InfoBlock label="风险提示" value={order.inspectionQuote.riskWarning} danger />
                )}

                {order.inspectionQuote.parts.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 mb-2">备件清单</h5>
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
                          {order.inspectionQuote.parts.map((p) => (
                            <tr key={p.id}>
                              <td className="px-3 py-2 text-sm text-slate-900">{p.partName}</td>
                              <td className="px-3 py-2 text-sm text-slate-500">{p.partNumber || "-"}</td>
                              <td className="px-3 py-2 text-sm text-slate-700 text-center">{p.quantity}</td>
                              <td className="px-3 py-2 text-sm text-slate-700 text-right">{formatCurrency(p.unitPrice)}</td>
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
                  </div>
                )}

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <div className="space-y-2 w-64">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">人工费</span>
                      <span className="text-slate-900">{formatCurrency(order.inspectionQuote.laborCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">备件费</span>
                      <span className="text-slate-900">{formatCurrency(order.inspectionQuote.partsTotal)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-slate-100">
                      <span className="text-slate-900">合计</span>
                      <span className="text-blue-700">{formatCurrency(order.inspectionQuote.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {order.customerConfirmation && (
            <Card
              title="客户确认记录"
              subtitle={`由前台 ${order.customerConfirmation.confirmedBy.name} 于 ${formatDateTime(order.customerConfirmation.confirmedAt)} 办理`}
            >
              <div className="space-y-3">
                <div className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                  {ConfirmationDecisionLabel[order.customerConfirmation.decision] || order.customerConfirmation.decision}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <InfoRow label="客户签名" value={order.customerConfirmation.customerSignature || "（已电子签名）"} />
                  <InfoRow label="确认时间" value={formatDateTime(order.customerConfirmation.confirmedAt)} />
                </div>
                {order.customerConfirmation.rejectReason && (
                  <div className="p-3 rounded bg-red-50 border border-red-200">
                    <p className="text-sm font-medium text-red-800 mb-1">拒绝原因：</p>
                    <p className="text-sm text-red-700">{order.customerConfirmation.rejectReason}</p>
                  </div>
                )}
                {order.customerConfirmation.reviseNotes && (
                  <div className="p-3 rounded bg-amber-50 border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-1">修改意见：</p>
                    <p className="text-sm text-amber-700">{order.customerConfirmation.reviseNotes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="流程时间线" subtitle="每次状态变更均记录责任人，全程留痕">
            <Timeline events={order.timelineEvents} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  full,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn(full && "md:col-span-2")}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        highlight && "bg-blue-50 border-blue-200",
        danger && "bg-red-50 border-red-200",
        !highlight && !danger && "bg-slate-50 border-slate-200"
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold mb-1.5",
          highlight && "text-blue-700",
          danger && "text-red-700",
          !highlight && !danger && "text-slate-600"
        )}
      >
        {label}
        {highlight && <span className="ml-1 text-[10px]">(客户确认时重点展示)</span>}
      </p>
      <p
        className={cn(
          "text-sm whitespace-pre-line leading-relaxed",
          highlight && "text-blue-900 font-medium",
          danger && "text-red-900",
          !highlight && !danger && "text-slate-800"
        )}
      >
        {value}
      </p>
    </div>
  );
}
