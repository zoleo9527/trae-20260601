
import { useEffect, useState } from 'react';
import {
  MapPin,
  AlertTriangle,
  ClipboardList,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '../lib/api';
import { StationMap } from '../components/StationMap';
import type { DashboardStats } from '../../shared/types';

const statCards = [
  { key: 'totalStations', label: '站点总数', icon: MapPin, color: 'bg-blue-500', suffix: '个' },
  { key: 'activeFaults', label: '活跃故障', icon: AlertTriangle, color: 'bg-red-500', suffix: '个' },
  { key: 'pendingWorkOrders', label: '待处理工单', icon: ClipboardList, color: 'bg-orange-500', suffix: '个' },
  { key: 'todayRevenue', label: '今日营收', icon: DollarSign, color: 'bg-green-500', prefix: '¥', suffix: '' },
  { key: 'pendingComplaints', label: '待处理投诉', icon: MessageSquare, color: 'bg-purple-500', suffix: '个' },
  { key: 'pendingDisputes', label: '待处理异议', icon: FileText, color: 'bg-yellow-500', suffix: '个' },
];

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<{
    faultTrends: { date: string; count: number }[];
    revenueTrends: { date: string; revenue: number }[];
    workOrderTrends: { date: string; completed: number; pending: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, trendsData] = await Promise.all([
          api.stats.dashboard(),
          api.stats.trends(),
        ]);
        setStats(statsData);
        setTrends(trendsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats ? (stats as Record<string, number>)[card.key] : 0;
          const displayValue = typeof value === 'number' ? value.toFixed(2) : value;
          return (
            <div key={card.key} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.prefix}{displayValue}{card.suffix}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-3 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">12%</span>
                <span className="text-gray-400 ml-2">较昨日</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 站点地图 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">站点分布地图</h3>
        <StationMap height="400px" />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 故障趋势 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">7日故障趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends?.faultTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 营收趋势 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">7日营收趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.revenueTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`¥${value}`, '营收']} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 工单统计 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">工单完成情况</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.workOrderTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="completed" name="已完成" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="待处理" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 站点状态概览 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">站点状态分布</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">正常站点</span>
              </div>
              <span className="font-semibold text-gray-900">3 / 6</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">告警站点</span>
              </div>
              <span className="font-semibold text-gray-900">2 / 6</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '33%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-gray-700">离线站点</span>
              </div>
              <span className="font-semibold text-gray-900">1 / 6</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: '17%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
