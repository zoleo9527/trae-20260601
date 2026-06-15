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
} from "~/utils/constants";
import { formatDateTime, formatCurrency, cn } from "~/utils/misc";
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
        inspectionQuote: { select: { totalAmount: true } },
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

  const counts: Record<string, number> = { ALL: orders.length };
  for (const c of statusCounts) {
    counts[c.status] = c._count.status;
  }
  const totalAll = statusCounts.reduce((s, c) => s + c._count.status, 0);
  counts.ALL = totalAll;

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
  const batchFetcher = useFetcher();

  const statusTabs = useMemo(() => {
    return [
      { key: "ALL", label: "全部" },
      { key: WorkOrderStatus.PENDING_INSPECTION, label: "待分配" },
      { key: WorkOrderStatus.INSPECTION_IN_PROGRESS, label: "检测中" },
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

  const canBatchAssign =
    (user.role === Role.RECEPTIONIST || user.role === Role.MANAGER) &&
    selectedIds.filter((id) => assignableOrders.find((o) => o.id === id)).length > 0;

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

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
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
            <batchFetcher.Form method="post" className="flex items-center gap-2 ml-auto">
              <input type="hidden" name="intent" value="batch-assign" />
              <input type="hidden" name="orderIds" value={selectedIds.join(",")} />
              <Select name="technicianId" className="min-w-40" defaultValue="">
                <option value="">选择维修师...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !batchFetcher.formData?.get("technicianId") ||
                  (batchFetcher.state === "loading" || batchFetcher.state === "submitting")
                }
              >
                批量分配检测 ({selectedIds.filter((id) => assignableOrders.find((o) => o.id === id)).length})
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
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    工单号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    客户信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    设备/故障
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    维修师
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    报价
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    接机时间
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {orders.map((order) => {
                  const isSelectable =
                    user.role !== Role.TECHNICIAN &&
                    order.status === WorkOrderStatus.PENDING_INSPECTION;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      {user.role !== Role.TECHNICIAN && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(order.id)}
                            onChange={() => isSelectable && toggleSelect(order.id)}
                            disabled={!isSelectable}
                            className="rounded border-slate-300 text-blue-600 disabled:opacity-30"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono text-slate-900 font-medium">{order.orderNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900 font-medium">{order.customerName}</div>
                        <div className="text-xs text-slate-500">{order.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900">
                          {order.deviceBrand} {order.deviceModel}
                          {order.deviceColor && (
                            <span className="text-slate-500 ml-1">({order.deviceColor})</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                          {order.faultDescription}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {order.assignedTechnician ? (
                          <div>
                            <span className="text-sm text-slate-900">{order.assignedTechnician.name}</span>
                            <span className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${RoleColor[order.assignedTechnician.role]}`}>
                              {RoleLabel[order.assignedTechnician.role]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">未分配</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.inspectionQuote ? (
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(order.inspectionQuote.totalAmount)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={order.status}
                          colorMap={WorkOrderStatusColor}
                          labelMap={WorkOrderStatusLabel}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDateTime(order.receivedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          查看详情 →
                        </Link>
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
