import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, TrendingDown, DollarSign, AlertCircle, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../data/mockData';

export default function LandlordSummary() {
  const { currentLandlordId, landlords } = useStore();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/landlords/${currentLandlordId}/summary`);
        const data = await response.json();
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [currentLandlordId]);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  if (!summary?.landlord) {
    return <div className="p-8">未找到房东信息</div>;
  }

  const { landlord, properties, totalIncome, totalExpenses, netIncome, monthlyTrend, pendingDisputes } = summary;

  const monthlyData = monthlyTrend || [
    { month: '7月', income: 0, expenses: 0 },
    { month: '8月', income: 0, expenses: 0 },
    { month: '9月', income: 0, expenses: 0 },
  ];

  const propertyDistribution = properties.map((p: any) => ({
    name: p.property.name,
    value: p.totalIncome,
  }));

  const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ec4899'];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">房东汇总</h1>
        <p className="text-slate-500 mt-1">{landlord.name} 的房产汇总数据</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">管理房产</span>
            <div className="bg-teal-50 p-2 rounded-lg">
              <Building2 className="text-teal-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{properties.length}</p>
          <p className="text-slate-500 text-sm mt-1">套房源</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">累计收入</span>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <TrendingUp className="text-emerald-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
          <p className="text-slate-500 text-sm mt-1">订单总收入</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">累计支出</span>
            <div className="bg-rose-50 p-2 rounded-lg">
              <TrendingDown className="text-rose-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-rose-600">{formatCurrency(totalExpenses)}</p>
          <p className="text-slate-500 text-sm mt-1">费用+维修支出</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">净收入</span>
            <div className="bg-amber-50 p-2 rounded-lg">
              <DollarSign className="text-amber-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{formatCurrency(netIncome)}</p>
          <p className="text-slate-500 text-sm mt-1">
            {pendingDisputes > 0 && (
              <span className="text-rose-500 flex items-center gap-1">
                <AlertCircle size={14} />
                {pendingDisputes} 条待处理异议
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">收入趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="income" name="收入" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">房源收入占比</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={propertyDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {propertyDistribution.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center">
            {propertyDistribution.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">房源明细</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {properties.map((item: any) => (
            <Link
              key={item.property.id}
              to={`/properties/${item.property.id}`}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.property.image}
                  alt={item.property.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <p className="font-medium text-slate-900">{item.property.name}</p>
                  <p className="text-slate-500 text-sm">{item.property.bedrooms} 室 · {item.totalOrders} 单</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-slate-500 text-xs">总收入</p>
                  <p className="font-semibold text-emerald-600">{formatCurrency(item.totalIncome)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs">总支出</p>
                  <p className="font-semibold text-rose-600">-{formatCurrency(item.totalExpenses + item.totalRepairs)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs">净收入</p>
                  <p className="font-bold text-teal-600">{formatCurrency(item.totalIncome - item.totalExpenses - item.totalRepairs)}</p>
                </div>
                {item.latestBill && (
                  <div className="text-right">
                    <p className="text-slate-500 text-xs">最新账单</p>
                    <p className="font-medium text-slate-700">{item.latestBill.year}年{item.latestBill.month}月</p>
                  </div>
                )}
                <ChevronRight className="text-slate-400" size={20} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
