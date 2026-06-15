import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams, useFetcher } from "@remix-run/react";
import { useMemo, useState } from "react";
import { requireUserId, getUser, requireRole } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import {
  WorkOrderStatus,
  WorkOrderStatusLabel,
  WorkOrderStatusColor,
  Role,
  RoleLabel,
  RoleColor,
  StatusResponsible,
  ResponsibleCategoryLabel,
  ResponsibleCategoryColor,
  StatusNextActions,
  SLA_HOURS,
  type NextAction,
  AlertStatus,
  WorkOrderStatus as Status,
} from "~/utils/constants";
import { formatDateTime, formatCurrency, cn, timeAgo } from "~/utils/misc";
import { Button, Card, Input, Select, StatusBadge, EmptyState } from "~/components/ui";
import { z } from "zod";

export const meta: MetaFunction = () => {
  return [{ title: "工单列表 - 手机维修店管理系统" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "ALL";
  const keyword = url.searchParams.get("keyword") || "";
  const assignee = url.searchParams.get("assignee") || "ALL";

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (assignee !== "ALL") where.assignedTechnicianId = assignee;
  if (keyword) {
    where.OR = [
      { orderNo: { contains: keyword } },
      { customerName: { contains: keyword } },
      { customerPhone: { contains: keyword } },
      { deviceModel: { contains: keyword } },
    ];
  }

  const [orders, technicians, statusCounts] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        assignedTechnician: { select: { id: true, name: true, role: true } },
        inspectionQuotes: {
          where: { isCurrent: true },
          select: { totalAmount: true, version: true, createdAt: true },
          orderBy: { version: "desc" },
          take: 1,
        },
        customerConfirmations: {
          where: { isCurrent: true },
          select: { version: true },
          orderBy: { version: "desc" },
          take: 1,
        },
        alerts: {
          where: { status: AlertStatus.ACTIVE },
          select: { id: true, alertType: true, title: true },
        },
        timelineEvents: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: Role.TECHNICIAN },
      select: { id: true, name: true },
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const totalAll = statusCounts.reduce((s, c) => s + c._count.status, 0);

  const counts: Record<string, number> = { 
    ALL: totalAll,
    [WorkOrderStatus.PENDING_INSPECTION]: 0,
    [WorkOrderStatus.INSPECTION_IN_PROGRESS]: 0,
    [WorkOrderStatus.REVISE_REQUESTED]: 0,
    [WorkOrderStatus.QUOTE_READY]: 0,
    [WorkOrderStatus.CUSTOMER_CONFIRMED]: 0,
    [WorkOrderStatus.CUSTOMER_REJECTED]: 0,
    [WorkOrderStatus.REPAIR_IN_PROGRESS]: 0,
    [WorkOrderStatus.COMPLETED]: 0,
  };
  for (const c of statusCounts) {
    counts[c.status] = c._count.status;
  }

  return json({ orders, technicians, counts, user, filters: { status, keyword, assignee } });
};

const BatchAssignSchema = z.object({
  orderIds: z.string().min(1, "请选择工单"),
  technicianId: z.string().min(1, "请选择维修师"),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireRole(request, [Role.RECEPTIONIST, Role.MANAGER]);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "batch-assign") {
    const validated = BatchAssignSchema.safeParse({
      orderIds: form.get("orderIds"),
      technicianId: form.get("technicianId"),
    });
    if (!validated.success) {
      return json({ ok: false, error: "参数错误" }, { status: 400 });
    }
    const ids = validated.data.orderIds.split(",").filter(Boolean);
    const technician = await prisma.user.findUnique({
      where: { id: validated.data.technicianId },
    });
    if (!technician) return json({ ok: false, error: "维修师不存在" }, { status: 400 });

    for (const id of ids) {
      const order = await prisma.workOrder.findUnique({ where: { id } });
      if (!order) continue;
      const prevStatus = order.status;
      await prisma.workOrder.update({
        where: { id },
        data: {
          assignedTechnicianId: technician.id,
          technicianAssignedAt: new Date(),
          status: WorkOrderStatus.INSPECTION_IN_PROGRESS,
          timelineEvents: {
            create: {
              fromStatus: prevStatus,
              toStatus: WorkOrderStatus.INSPECTION_IN_PROGRESS,
              eventType: "ASSIGNED",
              description: `工单已分配给维修师 ${technician.name}，开始检测。`,
              responsibleId: user.id,
            },
          },
        },
      });
    }

    return json({ ok: true, message: `已将 ${ids.length} 个工单分配给 ${technician.name}` });
  }

  return json({ ok: false, error: "未知操作" }, { status: 400 });
};

export default function OrdersIndex() {
  const { orders, technicians, counts, user, filters } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [technicianId, setTechnicianId] = useState<string>("");
  const batchFetcher = useFetcher();

  const getRowClass = (order: any) => {
    const now = Date.now();
    const lastEvent = order.timelineEvents?.[0];
    const stateEnteredAt = lastEvent ? new Date(lastEvent.createdAt).getTime() : new Date(order.createdAt).getTime();
    const slaHours = SLA_HOURS[order.status] || 24;
    const slaMs = slaHours * 60 * 60 * 1000;
    const age = now - stateEnteredAt;
    const isOverdue = age > slaMs;
    const hasAlerts = order.alerts && order.alerts.length > 0;

    if (hasAlerts) return "bg-red-50/70 hover:bg-red-50";
    if (isOverdue) return "bg-amber-50/60 hover:bg-amber-50";
    return "hover:bg-slate-50";
  };

  const getOverdueInfo = (order: any) => {
    const now = Date.now();
    const lastEvent = order.timelineEvents?.[0];
    const stateEnteredAt = lastEvent ? new Date(lastEvent.createdAt).getTime() : new Date(order.createdAt).getTime();
    const slaHours = SLA_HOURS[order.status] || 24;
    const slaMs = slaHours * 60 * 60 * 1000;
    const age = now - stateEnteredAt;
    return {
      isOverdue: age > slaMs,
      hoursInState: Math.round(age / (60 * 60 * 1000) * 10) / 10,
      slaHours,
    };
  };

  const getResponsibleDisplay = (order: any) => {
    const category = StatusResponsible[order.status] || "NONE";
    if (category === "TECHNICIAN" && order.assignedTechnician) {
      return {
        label: order.assignedTechnician.name,
        color: RoleColor[order.assignedTechnician.role],
        badge: RoleLabel[order.assignedTechnician.role],
        category,
      };
    }
    return {
      label: ResponsibleCategoryLabel[category],
      color: ResponsibleCategoryColor[category],
      badge: null,
      category,
    };
  };

  const getAvailableActions = (order: any): NextAction[] => {
    const actions = StatusNextActions[order.status] || [];
    return actions.filter((a) => a.roles.includes(user.role as any));
  };

  const buildRoute = (routeTpl: string, id: string) => routeTpl.replace("{id}", id);

  const statusTabs = useMemo(() => {
    return [
      { key: "ALL", label: "全部" },
      { key: WorkOrderStatus.PENDING_INSPECTION, label: "待分配" },
      { key: WorkOrderStatus.INSPECTION_IN_PROGRESS, label: "检测中" },
      { key: WorkOrderStatus.REVISE_REQUESTED, label: "需修改报价" },
      { key: WorkOrderStatus.QUOTE_READY, label: "待确认" },
      { key: WorkOrderStatus.CUSTOMER_CONFIRMED, label: "已确认" },
      { key: WorkOrderStatus.CUSTOMER_REJECTED, label: "已拒绝" },
      { key: WorkOrderStatus.REPAIR_IN_PROGRESS, label: "维修中" },
      { key: WorkOrderStatus.COMPLETED, label: "已完成" },
    ];
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const assignableOrders = orders.filter(
    (o) => o.status === WorkOrderStatus.PENDING_INSPECTION && user.role !== Role.TECHNICIAN
  );

  const selectableCount = selectedIds.filter((id) =>
    assignableOrders.find((o) => o.id === id)
  ).length;

  const canBatchAssign =
    (user.role === Role.RECEPTIONIST || user.role === Role.MANAGER) &&
    selectableCount > 0;

  const isSubmitting =
    batchFetcher.state === "loading" || batchFetcher.state === "submitting";

  const buildQuery = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === "ALL") params.delete(k);
      else params.set(k, v);
    });
    return params.toString() ? `?${params.toString()}` : "/";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工单列表</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {counts.ALL || 0} 个工单，不同角色看到的操作按钮不同，但状态口径完全一致
          </p>
        </div>
        {(user.role === Role.RECEPTIONIST || user.role === Role.MANAGER) && (
          <Link to="/orders/new">
            <Button>+ 新建接机工单</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {statusTabs.map((tab) => {
          const isActive = (filters.status || "ALL") === tab.key;
          return (
            <Link
              key={tab.key}
              to={buildQuery({ status: tab.key })}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all",
                isActive
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span className="text-lg font-bold text-slate-900">{counts[tab.key] || 0}</span>
              <span
                className={cn(
                  "text-xs mt-0.5",
                  isActive ? "text-blue-700 font-medium" : "text-slate-500"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Form method="get" className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative">
              <Input
                name="keyword"
                placeholder="搜索工单号/客户/手机型号"
                className="w-72"
                defaultValue={filters.keyword}
              />
            </div>
            {user.role !== Role.TECHNICIAN && (
              <div className="min-w-40">
                <Select name="assignee" defaultValue={filters.assignee || "ALL"}>
                  <option value="ALL">全部维修师</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <Button variant="secondary" size="sm" type="submit">
              搜索
            </Button>
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
              重置
            </Link>
          </Form>

          {canBatchAssign && (
            <batchFetcher.Form
              method="post"
              className="flex items-center gap-2 ml-auto"
              onSubmit={() => {
                const selectedAssignable = selectedIds.filter((id) =>
                  assignableOrders.find((o) => o.id === id)
                );
                if (!technicianId || selectedAssignable.length === 0) return;
              }}
            >
              <input type="hidden" name="intent" value="batch-assign" />
              <input
                type="hidden"
                name="orderIds"
                value={selectedIds
                  .filter((id) => assignableOrders.find((o) => o.id === id))
                  .join(",")}
              />
              <input type="hidden" name="technicianId" value={technicianId} />
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="block min-w-40 rounded-md border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 outline-none bg-white"
              >
                <option value="">选择维修师...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                size="sm"
                disabled={!technicianId || selectableCount === 0 || isSubmitting}
              >
                {isSubmitting ? "分配中..." : `批量分配检测 (${selectableCount})`}
              </Button>
            </batchFetcher.Form>
          )}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="暂无工单"
            description="试试调整筛选条件或新建一个工单"
          />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-2">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {user.role !== Role.TECHNICIAN && (
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </th>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    工单号
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    客户/设备
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    当前责任人
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    报价
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    时长/SLA
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    下一步待办
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {orders.map((order) => {
                  const isSelectable =
                    user.role !== Role.TECHNICIAN &&
                    order.status === WorkOrderStatus.PENDING_INSPECTION;
                  const responsible = getResponsibleDisplay(order);
                  const overdue = getOverdueInfo(order);
                  const actions = getAvailableActions(order);
                  const hasAlerts = order.alerts && order.alerts.length > 0;
                  return (
                    <tr key={order.id} className={`transition-colors ${getRowClass(order)}`}>
                      {user.role !== Role.TECHNICIAN && (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(order.id)}
                            onChange={() => isSelectable && toggleSelect(order.id)}
                            disabled={!isSelectable}
                            className="rounded border-slate-300 text-blue-600 disabled:opacity-30"
                          />
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-mono text-slate-900 font-medium">{order.orderNo}</div>
                          {hasAlerts && (
                            <div className="flex items-center gap-1" title={order.alerts.map((a: any) => a.title).join("；")}>
                              <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0">!</span>
                              <span className="text-[10px] font-semibold text-red-700">异常</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-sm text-slate-900 font-medium">{order.customerName}</div>
                          <div className="text-xs text-slate-500">{order.customerPhone}</div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {order.deviceBrand} {order.deviceModel}
                          </div>
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-[180px]">
                            {order.faultDescription}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge
                            status={order.status}
                            colorMap={WorkOrderStatusColor}
                            labelMap={WorkOrderStatusLabel}
                          />
                          {overdue.isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700">
                              <span>⏰</span>
                              超时 {overdue.hoursInState}h
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-slate-900">
                              {responsible.label}
                            </span>
                            {responsible.badge && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${responsible.color}`}>
                                {responsible.badge}
                              </span>
                            )}
                            {!responsible.badge && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${responsible.color}`}>
                                {ResponsibleCategoryLabel[responsible.category]}
                              </span>
                            )}
                          </div>
                          {order.assignedTechnician && responsible.category !== "TECHNICIAN" && (
                            <div className="text-[11px] text-slate-500">
                              维修师：{order.assignedTechnician.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {order.inspectionQuotes?.[0] ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-slate-900">
                              {formatCurrency(order.inspectionQuotes[0].totalAmount)}
                            </span>
                            {order.inspectionQuotes[0].version > 1 && (
                              <span className="text-[10px] text-slate-500">
                                V{order.inspectionQuotes[0].version}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs ${overdue.isOverdue ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                            {overdue.hoursInState} 小时
                          </span>
                          <span className="text-[10px] text-slate-400">
                            SLA {overdue.slaHours}h · {timeAgo(order.receivedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5 items-center justify-end">
                          {actions.slice(0, 2).map((action, idx) => {
                            const route = action.route ? buildRoute(action.route, order.id) : null;
                            const variantClass =
                              action.variant === "primary"
                                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                : action.variant === "warning"
                                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                                : action.variant === "danger"
                                ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300";
                            if (action.intent && route) {
                              return (
                                <Form method="post" action={route} key={idx} className="inline">
                                  <input type="hidden" name="intent" value={action.intent} />
                                  <button
                                    type="submit"
                                    className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border shadow-sm transition-colors ${variantClass}`}
                                  >
                                    {action.label}
                                  </button>
                                </Form>
                              );
                            }
                            return route ? (
                              <Link
                                key={idx}
                                to={route}
                                className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border shadow-sm transition-colors ${variantClass}`}
                              >
                                {action.label} →
                              </Link>
                            ) : null;
                          })}
                          <Link
                            to={`/orders/${order.id}`}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            详情
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
