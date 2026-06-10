import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { prisma } from "@/lib/prisma";
import { getServerAuth, SessionUser, roleLabel } from "@/lib/auth";
import {
  formatTime,
  formatRelativeTime,
  statusLabel,
  statusColor,
  urgencyLabel,
  urgencyColor,
} from "@/lib/format";
import { HotspotStatus, UserRole } from "@/lib/types";
import Layout from "@/components/Layout";

interface DispatchOrderItem {
  id: string;
  orderNo: string;
  createdAt: string;
  acceptedAt: string | null;
  assignee: { id: string; name: string; role: string } | null;
}

interface HotspotItem {
  id: string;
  title: string;
  location: string;
  bikeCount: number;
  urgency: number;
  status: string;
  submittedAt: string;
  dispatchedAt: string | null;
  submitter: { name: string; role: string };
  dispatcher: { id: string; name: string; role: string } | null;
  dispatchOrders: DispatchOrderItem[];
  _count: { comments: number; attachments: number };
}

interface InspectorOption {
  id: string;
  name: string;
}

interface HomeProps {
  user: SessionUser;
  hotspots: HotspotItem[];
  inspectors: InspectorOption[];
}

type ViewMode = "ALL" | "MY_TODO";

function hasAssignee(h: HotspotItem): boolean {
  return h.dispatchOrders.length > 0 && h.dispatchOrders[0].assignee !== null;
}

function isMyTodo(h: HotspotItem, userId: string): boolean {
  const order = h.dispatchOrders[0];
  return (
    !!order?.assignee?.id &&
    order.assignee.id === userId &&
    (h.status === HotspotStatus.DISPATCHED || h.status === HotspotStatus.IN_PROGRESS)
  );
}

export default function Home({ user, hotspots, inspectors }: HomeProps) {
  const isInspector = user.role === UserRole.INSPECTOR;

  const [viewMode, setViewMode] = useState<ViewMode>(
    isInspector ? "MY_TODO" : "ALL"
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setStatusFilter("ALL");
  };

  const handleAssigneeFilterChange = (value: string) => {
    setAssigneeFilter(value);
    setStatusFilter("ALL");
  };

  const globalStats = useMemo(() => ({
    total: hotspots.length,
    pending: hotspots.filter((h) => h.status === HotspotStatus.PENDING).length,
    dispatched: hotspots.filter((h) => h.status === HotspotStatus.DISPATCHED).length,
    inProgress: hotspots.filter((h) => h.status === HotspotStatus.IN_PROGRESS).length,
    completed: hotspots.filter((h) => h.status === HotspotStatus.COMPLETED).length,
    myTodo: hotspots.filter((h) => isMyTodo(h, user.id)).length,
  }), [hotspots, user.id]);

  const baseSet = useMemo(() => {
    if (viewMode === "MY_TODO") {
      return hotspots.filter((h) => isMyTodo(h, user.id));
    }
    if (assigneeFilter === "UNASSIGNED") {
      return hotspots.filter((h) => !hasAssignee(h));
    }
    if (assigneeFilter !== "ALL") {
      return hotspots.filter((h) => h.dispatchOrders[0]?.assignee?.id === assigneeFilter);
    }
    return hotspots;
  }, [hotspots, viewMode, assigneeFilter, user.id]);

  const statusTabs = useMemo(() => {
    const tabs = [
      { key: "ALL", label: "全部", count: baseSet.length },
      { key: HotspotStatus.PENDING, label: "待派单", count: 0 },
      { key: HotspotStatus.DISPATCHED, label: "已派单", count: 0 },
      { key: HotspotStatus.IN_PROGRESS, label: "处理中", count: 0 },
      { key: HotspotStatus.COMPLETED, label: "已完成", count: 0 },
    ];

    if (viewMode === "MY_TODO") {
      tabs.splice(1, 1);
    }

    for (const t of tabs) {
      if (t.key === "ALL") continue;
      t.count = baseSet.filter((h) => h.status === t.key).length;
    }
    return tabs;
  }, [baseSet, viewMode]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return baseSet;
    return baseSet.filter((h) => h.status === statusFilter);
  }, [baseSet, statusFilter]);

  const effectiveStatusFilter = useMemo(() => {
    if (!statusTabs.find((t) => t.key === statusFilter)) {
      return "ALL";
    }
    return statusFilter;
  }, [statusTabs, statusFilter]);

  const getAcceptHint = (h: HotspotItem) => {
    const order = h.dispatchOrders[0];
    if (!order) return null;
    if (h.status === HotspotStatus.DISPATCHED && !order.acceptedAt) {
      return { text: "待接单", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "⏳" };
    }
    if (h.status === HotspotStatus.DISPATCHED && order.acceptedAt) {
      return { text: "已接单", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "📞" };
    }
    if (h.status === HotspotStatus.IN_PROGRESS) {
      return { text: "处理中", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "🔧" };
    }
    if (h.status === HotspotStatus.COMPLETED) {
      return { text: "已完成", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅" };
    }
    return null;
  };

  const emptyMessage = useMemo(() => {
    if (filtered.length > 0) return "";
    if (viewMode === "MY_TODO") {
      return effectiveStatusFilter === "ALL"
        ? "暂无待办任务，您当前没有待接单或处理中的任务"
        : `暂无${statusLabel(effectiveStatusFilter as HotspotStatus)}状态的待办任务`;
    }
    if (assigneeFilter === "UNASSIGNED") {
      return effectiveStatusFilter === "ALL"
        ? "暂无未指派处理人的热点"
        : `未指派的热点中没有${statusLabel(effectiveStatusFilter as HotspotStatus)}状态的记录`;
    }
    if (assigneeFilter !== "ALL") {
      const inspName = inspectors.find((i) => i.id === assigneeFilter)?.name || "";
      return effectiveStatusFilter === "ALL"
        ? `${inspName}暂无负责的热点`
        : `${inspName}没有${statusLabel(effectiveStatusFilter as HotspotStatus)}状态的记录`;
    }
    return effectiveStatusFilter === "ALL"
      ? "暂无数据"
      : `暂无${statusLabel(effectiveStatusFilter as HotspotStatus)}状态的热点`;
  }, [filtered.length, viewMode, assigneeFilter, effectiveStatusFilter, inspectors]);

  const viewModeLabel = viewMode === "MY_TODO" ? "我的待办" : "热点区域列表";

  return (
    <>
      <Head>
        <title>热点区域 - 共享单车运维调度系统</title>
      </Head>
      <Layout user={user}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "热点总数", value: globalStats.total, color: "from-slate-500 to-slate-700" },
              { label: "待派单", value: globalStats.pending, color: "from-amber-500 to-amber-600" },
              { label: "已派单", value: globalStats.dispatched, color: "from-blue-500 to-blue-600" },
              { label: "处理中", value: globalStats.inProgress, color: "from-purple-500 to-purple-600" },
              { label: "已完成", value: globalStats.completed, color: "from-emerald-500 to-emerald-600" },
            ].map((s) => (
              <div
                key={s.label}
                className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white shadow-sm`}
              >
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-white/80 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {isInspector && (
            <div
              className={`rounded-xl p-4 border-2 transition cursor-pointer ${
                viewMode === "MY_TODO"
                  ? "bg-blue-50 border-blue-300"
                  : globalStats.myTodo > 0
                    ? "bg-white border-gray-200 hover:border-blue-200"
                    : "bg-gray-50 border-gray-200"
              }`}
              onClick={() => handleViewModeChange(viewMode === "MY_TODO" ? "ALL" : "MY_TODO")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      viewMode === "MY_TODO"
                        ? "bg-blue-500 text-white"
                        : globalStats.myTodo > 0
                          ? "bg-amber-100 text-amber-600"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    📋
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      我的待办
                      {viewMode === "MY_TODO" && (
                        <span className="ml-2 text-xs font-normal text-blue-600">当前筛选中</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {globalStats.myTodo > 0
                        ? `待接单和处理中共 ${globalStats.myTodo} 项`
                        : "暂无待接单或处理中的任务"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {globalStats.myTodo > 0 && (
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        viewMode === "MY_TODO" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                      }`}
                    >
                      {globalStats.myTodo}
                    </span>
                  )}
                  <span className="text-gray-400 text-sm">
                    {viewMode === "MY_TODO" ? "查看全部" : "筛选待办"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-900">{viewModeLabel}</h2>
                {!isInspector && (
                  <div className="relative">
                    <select
                      value={assigneeFilter}
                      onChange={(e) => handleAssigneeFilterChange(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">全部处理人</option>
                      <option value="UNASSIGNED">未指派（待派单）</option>
                      {inspectors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {viewMode === "MY_TODO" && (
                  <button
                    onClick={() => handleViewModeChange("ALL")}
                    className="text-xs text-blue-600 hover:text-blue-800 transition"
                  >
                    查看全部 →
                  </button>
                )}
                <span className="text-xs text-gray-500">
                  {filtered.length} 条结果
                </span>
              </div>
            </div>

            <div className="flex gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto">
              {statusTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    effectiveStatusFilter === t.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-xs px-1 ${
                      effectiveStatusFilter === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-3xl mb-2">
                    {viewMode === "MY_TODO" ? "📋" : assigneeFilter === "UNASSIGNED" ? "📭" : "🔍"}
                  </div>
                  <div className="text-sm text-gray-400">{emptyMessage}</div>
                </div>
              ) : (
                filtered.map((h) => {
                  const acceptHint = getAcceptHint(h);
                  const latestOrder = h.dispatchOrders[0];
                  const assignedToMe = latestOrder?.assignee?.id === user.id;

                  return (
                    <Link
                      key={h.id}
                      href={`/hotspot/${h.id}`}
                      className="block hover:bg-gray-50 transition px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-gray-900 truncate">{h.title}</h3>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${statusColor(
                                h.status as HotspotStatus
                              )}`}
                            >
                              {statusLabel(h.status as HotspotStatus)}
                            </span>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${urgencyColor(
                                h.urgency
                              )}`}
                            >
                              {urgencyLabel(h.urgency)}
                            </span>
                            {assignedToMe && isInspector && (
                              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                指派给我
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 text-sm text-gray-500 flex items-center gap-1">
                            <span>📍</span>
                            <span className="truncate">{h.location}</span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                              <span>
                                提交人：<span className="text-gray-700">{h.submitter.name}</span>
                              </span>
                            </div>
                            {h.dispatcher && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                <span>
                                  调度：<span className="text-gray-700">{h.dispatcher.name}</span>
                                </span>
                              </div>
                            )}
                            {latestOrder?.assignee && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>
                                  处理人：<span className="text-gray-700">{latestOrder.assignee.name}</span>
                                </span>
                              </div>
                            )}
                            {!hasAssignee(h) && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span className="text-amber-600 font-medium">待派单 · 未指派处理人</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span>🚲</span>
                              <span>{h.bikeCount} 辆</span>
                            </div>
                            <span>💬 {h._count.comments}</span>
                            <span>📎 {h._count.attachments}</span>
                          </div>

                          {latestOrder ? (
                            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-50 border border-gray-100 text-gray-500">
                                📋 派单 {latestOrder.orderNo}
                                <span className="text-gray-400 mx-0.5">·</span>
                                {formatRelativeTime(latestOrder.createdAt)}
                              </span>
                              {acceptHint && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${acceptHint.color}`}
                                >
                                  {acceptHint.icon}
                                  {acceptHint.text}
                                </span>
                              )}
                              {latestOrder.acceptedAt && (
                                <span className="text-gray-400">
                                  接单于 {formatTime(latestOrder.acceptedAt)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="mt-2.5 text-xs">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-100 text-amber-600">
                                📭 尚未派单，等待调度员指派处理人
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-400">{formatRelativeTime(h.submittedAt)}</div>
                          {h.dispatchedAt && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              派单 {formatRelativeTime(h.dispatchedAt)}
                            </div>
                          )}
                          <div className="mt-1.5 text-blue-600 text-xs font-medium inline-flex items-center gap-1">
                            详情
                            <span>→</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getServerAuth(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const hotspotsRaw = await prisma.hotspotArea.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      submitter: { select: { name: true, role: true } },
      dispatcher: { select: { id: true, name: true, role: true } },
      dispatchOrders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          assignee: { select: { id: true, name: true, role: true } },
        },
      },
      _count: { select: { comments: true, attachments: true } },
    },
  });

  const hotspots: HotspotItem[] = hotspotsRaw.map((h) => ({
    ...h,
    submittedAt: h.submittedAt.toISOString(),
    dispatchedAt: h.dispatchedAt?.toISOString() || null,
    completedAt: h.completedAt?.toISOString() || null,
    submitter: h.submitter,
    dispatcher: h.dispatcher,
    dispatchOrders: h.dispatchOrders.map((d) => ({
      id: d.id,
      orderNo: d.orderNo,
      createdAt: d.createdAt.toISOString(),
      acceptedAt: d.acceptedAt?.toISOString() || null,
      assignee: d.assignee,
    })),
  }));

  const inspectors: InspectorOption[] = await prisma.user.findMany({
    where: { role: UserRole.INSPECTOR },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return { props: { user, hotspots, inspectors } };
};
