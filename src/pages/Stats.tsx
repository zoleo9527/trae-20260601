import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { statsApi } from '@/lib/api';
import type { ReworkRateStats, PackageConsumptionStats, CompensationStats, TodayStats } from '@/types';
import { AlertTriangle, Package, Gift, RefreshCw } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Stats() {
  const [period, setPeriod] = useState<'7d' | '30d' | ''>('30d');
  const [reworkStats, setReworkStats] = useState<ReworkRateStats | null>(null);
  const [packageStats, setPackageStats] = useState<PackageConsumptionStats | null>(null);
  const [compensationStats, setCompensationStats] = useState<CompensationStats | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rework, pkg, comp, today] = await Promise.all([
        statsApi.reworkRate(period || undefined),
        statsApi.packageConsumption(),
        statsApi.compensation(),
        statsApi.today(),
      ]);
      setReworkStats(rework);
      setPackageStats(pkg);
      setCompensationStats(comp);
      setTodayStats(today);
    } catch {
      console.error('加载统计数据失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-444">加载中...</div>
      </div>
    );
  }

  const reworkChartData = reworkStats?.by_employee?.map((e) => ({
    name: e.employee_name,
    返工率: e.rework_rate,
    总工单: e.total,
    返工数: e.rework_count,
  })) || [];

  const packageChartData = packageStats?.by_template?.map((t) => ({
    name: t.name,
    已消耗: t.total_items - t.remaining_items,
    剩余: t.remaining_items,
  })) || [];

  const pieData = [
    { name: '已完成', value: todayStats?.summary.completed_count || 0 },
    { name: '施工中', value: todayStats?.summary.in_progress_count || 0 },
    { name: '待分配', value: todayStats?.summary.pending_count || 0 },
    { name: '返工', value: todayStats?.summary.rework_count || 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">数据报表</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                period === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-444'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                period === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-444'
              }`}
            >
              近7天
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                period === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-444'
              }`}
            >
              近30天
            </button>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <div className="text-sm text-gray-444 mb-1">今日营收</div>
          <div className="text-2xl font-bold text-gray-800">
            ¥{todayStats?.summary.total_revenue || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <div className="text-sm text-gray-444 mb-1">整体返工率</div>
          <div className="text-2xl font-bold text-orange-600">
            {reworkStats?.overall.rework_rate || 0}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            返工 {reworkStats?.overall.rework_count || 0} / 总工单 {reworkStats?.overall.total || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <div className="text-sm text-gray-444 mb-1">套餐消耗率</div>
          <div className="text-2xl font-bold text-purple-600">
            {packageStats?.by_template?.[0]?.consumption_rate || 0}%
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <div className="text-sm text-gray-444 mb-1">补偿/退还次数</div>
          <div className="text-2xl font-bold text-red-600">
            {compensationStats?.records?.length || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            技师返工率
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reworkChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip />
                <Bar dataKey="返工率" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package size={20} className="text-purple-500" />
            套餐消耗情况
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="已消耗" stackId="a" fill="#8B5CF6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="剩余" stackId="a" fill="#DDD6FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <h2 className="text-lg font-semibold mb-4">今日工单状态分布</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                <span className="text-sm text-gray-444">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift size={20} className="text-red-500" />
            补偿/退还记录
          </h2>
          {compensationStats?.records?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">暂无补偿记录</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {compensationStats?.records?.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800">{record.customer_name}</div>
                    <div className="text-sm text-gray-444">
                      {record.package_name} · {record.service_type}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        record.type === 'compensation'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {record.type === 'compensation' ? '补偿赠送' : '返工退还'} +{record.count}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">{record.created_at?.slice(0, 10)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {todayStats?.low_packages && todayStats.low_packages.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            套餐次数不足预警（剩余 ≤ 2 次）
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {todayStats.low_packages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-lg p-4">
                <div className="font-medium text-gray-800">{pkg.customer_name}</div>
                <div className="text-sm text-gray-444">{pkg.package_name}</div>
                <div className="text-amber-600 font-semibold mt-1">
                  剩余 {pkg.remaining_count} 次
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
