import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, Calendar, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCargoStore } from "@/store/useCargoStore";
import type { CargoStatus } from "@/types";

const statusConfig: { status: CargoStatus; icon: React.ElementType; color: string; bg: string; badge: string }[] = [
  { status: "待通知", icon: Bell, color: "text-slate-400", bg: "bg-slate-800", badge: "bg-slate-600 text-slate-100" },
  { status: "已通知", icon: BellRing, color: "text-blue-400", bg: "bg-slate-800", badge: "bg-blue-600 text-blue-100" },
  { status: "已预约", icon: Calendar, color: "text-cyan-400", bg: "bg-slate-800", badge: "bg-cyan-600 text-cyan-100" },
  { status: "提货中", icon: Package, color: "text-violet-400", bg: "bg-slate-800", badge: "bg-violet-600 text-violet-100" },
  { status: "超期未提", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-900/40 ring-1 ring-amber-500/50", badge: "bg-amber-600 text-amber-100" },
  { status: "已完成", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-slate-800", badge: "bg-emerald-600 text-emerald-100" },
];

const targetPage: Record<CargoStatus, string> = {
  "待通知": "/arrival",
  "已通知": "/arrival",
  "已预约": "/pickup",
  "提货中": "/pickup",
  "超期未提": "/pickup",
  "已完成": "/pickup",
};

export default function Dashboard() {
  const { cargos, getNotifyCount } = useCargoStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CargoStatus | "全部">("全部");

  const counts = statusConfig.map((c) => ({
    ...c,
    count: cargos.filter((cargo) => cargo.status === c.status).length,
  }));

  const filtered = filter === "全部" ? cargos : cargos.filter((c) => c.status === filter);

  const badgeClass = (s: CargoStatus) => statusConfig.find((c) => c.status === s)?.badge ?? "";

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <button
          onClick={() => setFilter("全部")}
          className={`rounded-lg p-4 text-left transition ${
            filter === "全部" ? "bg-amber-500/20 ring-2 ring-amber-500" : "bg-slate-800"
          }`}
        >
          <div className="text-sm text-slate-400">全部</div>
          <div className="text-2xl font-bold text-amber-500">{cargos.length}</div>
        </button>
        {counts.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.status}
              onClick={() => setFilter(c.status)}
              className={`rounded-lg p-4 text-left transition ${c.bg} ${
                filter === c.status ? "ring-2 ring-amber-500" : ""
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${c.color}`} />
              <div className="text-sm text-slate-400">{c.status}</div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.count}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="px-4 py-3 text-left font-medium">货票号</th>
              <th className="px-4 py-3 text-left font-medium">车次</th>
              <th className="px-4 py-3 text-left font-medium">品名</th>
              <th className="px-4 py-3 text-left font-medium">收货人</th>
              <th className="px-4 py-3 text-left font-medium">到站时间</th>
              <th className="px-4 py-3 text-left font-medium">通知次数</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cargo) => (
              <tr key={cargo.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="px-4 py-3 font-mono text-slate-200">{cargo.ticketNo}</td>
                <td className="px-4 py-3 font-mono text-slate-200">{cargo.trainNo}</td>
                <td className="px-4 py-3 text-slate-200">{cargo.goodsName}</td>
                <td className="px-4 py-3 text-slate-200">{cargo.consignee}</td>
                <td className="px-4 py-3 text-slate-300">{cargo.arrivalTime}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 rounded-full bg-slate-700 text-xs text-slate-200 px-1.5">
                    {getNotifyCount(cargo.id)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(cargo.status)}`}>
                    {cargo.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(targetPage[cargo.status])}
                    className="text-amber-500 hover:text-amber-400 font-medium"
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
