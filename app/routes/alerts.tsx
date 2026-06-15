import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useFetcher } from "@remix-run/react";
import { requireUserId, getUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import {
  Role,
  AlertTypeLabel,
  AlertStatus,
  WorkOrderStatusLabel,
  WorkOrderStatusColor,
  RoleLabel,
  RoleColor,
} from "~/utils/constants";
import { formatDateTime, timeAgo } from "~/utils/misc";
import { Button, Card, StatusBadge, EmptyState } from "~/components/ui";

export const meta: MetaFunction = () => [
  { title: "异常提醒中心 - 手机维修店管理系统" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const where: any = {};
  if (user.role === Role.TECHNICIAN) {
    where.OR = [
      { assignedToId: user.id },
      { workOrder: { assignedTechnicianId: user.id } },
    ];
  } else if (user.role === Role.RECEPTIONIST) {
    // 前台看到所有活跃异常
  }

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      workOrder: {
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          deviceModel: true,
          status: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return json({ alerts, user });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const alertId = form.get("alertId") as string;

  if (!alertId) return json({ ok: false }, { status: 400 });

  if (intent === "acknowledge") {
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      },
    });
  } else if (intent === "resolve") {
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }

  return json({ ok: true });
};

export default function AlertsPage() {
  const { alerts, user } = useLoaderData<typeof loader>();

  const activeCount = alerts.filter((a) => a.status === AlertStatus.ACTIVE).length;
  const acknowledgedCount = alerts.filter((a) => a.status === AlertStatus.ACKNOWLEDGED).length;
  const resolvedCount = alerts.filter((a) => a.status === AlertStatus.RESOLVED).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">异常提醒中心</h1>
        <p className="text-sm text-slate-500 mt-1">
          所有流程异常自动触发提醒，异常样例可直接在这里验证是否被系统接住
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="待处理" count={activeCount} color="bg-red-50 text-red-700 border-red-200" />
        <StatCard label="处理中" count={acknowledgedCount} color="bg-amber-50 text-amber-700 border-amber-200" />
        <StatCard label="已解决" count={resolvedCount} color="bg-green-50 text-green-700 border-green-200" />
      </div>

      {alerts.length === 0 ? (
        <Card>
          <EmptyState title="暂无异常提醒" description="系统运行平稳，所有流程正常" />
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        alert.status === AlertStatus.ACTIVE
                          ? "bg-red-100 text-red-800"
                          : alert.status === AlertStatus.ACKNOWLEDGED
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {alert.status === AlertStatus.ACTIVE
                        ? "待处理"
                        : alert.status === AlertStatus.ACKNOWLEDGED
                        ? "处理中"
                        : "已解决"}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {AlertTypeLabel[alert.alertType] || alert.alertType}
                    </span>
                    <span className="text-xs text-slate-400">
                      {timeAgo(alert.createdAt)} · {formatDateTime(alert.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/orders/${alert.workOrder.id}`}
                      className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      [{alert.workOrder.orderNo}]
                    </Link>
                    <span className="text-sm text-slate-700">
                      {alert.workOrder.customerName} · {alert.workOrder.deviceModel}
                    </span>
                    <StatusBadge
                      status={alert.workOrder.status}
                      colorMap={WorkOrderStatusColor}
                      labelMap={WorkOrderStatusLabel}
                    />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{alert.title}</h4>
                  <p className="text-sm text-slate-600">{alert.message}</p>
                  {alert.assignedTo && (
                    <div className="mt-2 text-xs text-slate-500">
                      处理责任人：
                      <span className="font-medium text-slate-700 ml-1">
                        {alert.assignedTo.name}
                      </span>
                      <span
                        className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${RoleColor[alert.assignedTo.role]}`}
                      >
                        {RoleLabel[alert.assignedTo.role]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {alert.status === AlertStatus.ACTIVE && (
                    <>
                      <Form method="post">
                        <input type="hidden" name="alertId" value={alert.id} />
                        <input type="hidden" name="intent" value="acknowledge" />
                        <Button type="submit" variant="secondary" size="sm">
                          标记已知晓
                        </Button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="alertId" value={alert.id} />
                        <input type="hidden" name="intent" value="resolve" />
                        <Button type="submit" size="sm" variant="primary">
                          已解决
                        </Button>
                      </Form>
                    </>
                  )}
                  {alert.status === AlertStatus.ACKNOWLEDGED && (
                    <Form method="post">
                      <input type="hidden" name="alertId" value={alert.id} />
                      <input type="hidden" name="intent" value="resolve" />
                      <Button type="submit" size="sm">
                        标记已解决
                      </Button>
                    </Form>
                  )}
                  <Link to={`/orders/${alert.workOrder.id}`}>
                    <Button variant="ghost" size="sm">查看工单 →</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <div className="text-3xl font-bold">{count}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}
