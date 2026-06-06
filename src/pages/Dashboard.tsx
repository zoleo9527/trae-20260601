import { useEffect, useState } from 'react';
import { ClipboardList, Truck, AlertTriangle, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Timeline } from '../components/Timeline';
import type { DashboardData, UnloadRecord } from '../../shared/types';
import { useAppStore } from '../store/appStore';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [todos, setTodos] = useState<UnloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [dashboardData, pendingRecords] = await Promise.all([
          api.getDashboard(),
          api.getRecords(),
        ]);
        setData(dashboardData);

        let filtered: UnloadRecord[] = [];
        if (currentUser.role === 'dispatcher') {
          filtered = pendingRecords.filter(r => r.status === 'pending');
        } else if (currentUser.role === 'forklift') {
          filtered = pendingRecords.filter(r => r.status === 'checkin' || r.status === 'unloading');
        } else {
          filtered = pendingRecords.filter(r => r.status === 'finished' || r.status === 'discrepancy');
        }
        setTodos(filtered.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser.role]);

  const todoCards = [
    {
      key: 'pendingCheckin',
      label: '待签到车辆',
      icon: Truck,
      color: 'from-blue-600 to-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      link: '/check-in',
    },
    {
      key: 'pendingUnload',
      label: '待卸货/卸货中',
      icon: ClipboardList,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      link: '/check-in',
    },
    {
      key: 'pendingDiscrepancy',
      label: '待处理差异',
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      link: '/discrepancy',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-slate-800/50 rounded-xl animate-pulse" />
          <div className="h-96 bg-slate-800/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">工作台</h1>
        <p className="text-slate-400 text-sm mt-1">
          你好，{currentUser.name}，以下是今日需要处理的事项
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {todoCards.map((card) => {
          const count = data?.todoCounts[card.key as keyof typeof data.todoCounts] || 0;
          return (
            <button
              key={card.key}
              onClick={() => navigate(card.link)}
              className={`group relative overflow-hidden rounded-xl p-5 ${card.bg} border ${card.border} hover:scale-[1.02] transition-all duration-200 text-left`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${card.text} mb-1`}>{card.label}</p>
                  <p className="text-3xl font-bold text-slate-100">{count}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400 group-hover:text-slate-300">
                查看全部
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              我的待办
            </h2>
            <span className="text-xs text-slate-400">
              共 {todos.length} 条
            </span>
          </div>

          {todos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              暂无待办事项
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => navigate(
                    record.status === 'discrepancy' || record.status === 'finished'
                      ? '/discrepancy'
                      : '/check-in'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-100">{record.plateNumber}</p>
                      <p className="text-xs text-slate-400">
                        {record.driverName} · {record.cargoType} · {record.plannedQuantity}件
                        {record.dockNumber && ` · ${record.dockNumber}号月台`}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            最近状态变化
          </h2>
          <div className="overflow-y-auto max-h-[420px] pr-1">
            {data && <Timeline logs={data.recentStatus.slice(0, 8)} />}
          </div>
        </div>
      </div>
    </div>
  );
}
