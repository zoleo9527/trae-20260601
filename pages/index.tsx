import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { prisma } from "@/lib/prisma";
import { getServerAuth, SessionUser, roleLabel } from "@/lib/auth";
import {
  formatRelativeTime,
  statusLabel,
  statusColor,
  urgencyLabel,
  urgencyColor,
} from "@/lib/format";
import { HotspotStatus } from "@/lib/types";
import Layout from "@/components/Layout";

interface HotspotItem {
  id: string;
  title: string;
  location: string;
  bikeCount: number;
  urgency: number;
  status: string;
  submittedAt: string;
  submitter: { name: string; role: string };
  dispatcher: { name: string; role: string } | null;
  dispatchOrders: {
    id: string;
    orderNo: string;
    assignee: { name: string; role: string } | null;
  }[];
  _count: { comments: number; attachments: number };
}

interface HomeProps {
  user: SessionUser;
  hotspots: HotspotItem[];
}

export default function Home({ user, hotspots }: HomeProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const stats = useMemo(() => {
    return {
      total: hotspots.length,
      pending: hotspots.filter((h) => h.status === HotspotStatus.PENDING).length,
      dispatched: hotspots.filter((h) => h.status === HotspotStatus.DISPATCHED).length,
      inProgress: hotspots.filter((h) => h.status === HotspotStatus.IN_PROGRESS).length,
      completed: hotspots.filter((h) => h.status === HotspotStatus.COMPLETED).length,
    };
  }, [hotspots]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return hotspots;
    return hotspots.filter((h) => h.status === statusFilter);
  }, [hotspots, statusFilter]);

  const statusTabs = [
    { key: "ALL", label: "全部", count: stats.total },
    { key: HotspotStatus.PENDING, label: "待派单", count: stats.pending },
    { key: HotspotStatus.DISPATCHED, label: "已派单", count: stats.dispatched },
    { key: HotspotStatus.IN_PROGRESS, label: "处理中", count: stats.inProgress },
    { key: HotspotStatus.COMPLETED, label: "已完成", count: stats.completed },
  ];

  return (
    <>
      <Head>
        <title>热点区域 - 共享单车运维调度系统</title>
      </Head>
      <Layout user={user}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "热点总数", value: stats.total, color: "from-slate-500 to-slate-700" },
              { label: "待派单", value: stats.pending, color: "from-amber-500 to-amber-600" },
              { label: "已派单", value: stats.dispatched, color: "from-blue-500 to-blue-600" },
              { label: "处理中", value: stats.inProgress, color: "from-purple-500 to-purple-600" },
              { label: "已完成", value: stats.completed, color: "from-emerald-500 to-emerald-600" },
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">热点区域列表</h2>
              <div className="text-xs text-gray-500">
                共 {filtered.length} 条记录
              </div>
            </div>

            <div className="flex gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto">
              {statusTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    statusFilter === t.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                      statusFilter === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">暂无数据</div>
              ) : (
                filtered.map((h) => (
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
                              <span className="text-gray-400 ml-1">({roleLabel(h.submitter.role as any)})</span>
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
                          {h.dispatchOrders[0]?.assignee && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>
                                处理人：<span className="text-gray-700">{h.dispatchOrders[0].assignee.name}</span>
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span>🚲</span>
                            <span>车辆 {h.bikeCount} 辆</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span>💬 {h._count.comments}</span>
                            <span>📎 {h._count.attachments}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-400">{formatRelativeTime(h.submittedAt)}</div>
                        <div className="mt-1 text-blue-600 text-xs font-medium inline-flex items-center gap-1">
                          查看详情
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
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
      dispatcher: { select: { name: true, role: true } },
      dispatchOrders: {
        take: 1,
        include: { assignee: { select: { name: true, role: true } } },
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
      ...d,
      createdAt: d.createdAt.toISOString(),
      acceptedAt: d.acceptedAt?.toISOString() || null,
      completedAt: d.completedAt?.toISOString() || null,
    })),
  }));

  return { props: { user, hotspots } };
};
