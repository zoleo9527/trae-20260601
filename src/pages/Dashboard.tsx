import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShoppingCart, Wrench, MessageSquareWarning, DollarSign, Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../data/mockData';

const monthlyData = [
  { month: '1月', income: 12000, expenses: 3500 },
  { month: '2月', income: 15000, expenses: 4200 },
  { month: '3月', income: 18000, expenses: 3800 },
  { month: '4月', income: 22000, expenses: 4500 },
  { month: '5月', income: 28000, expenses: 5200 },
  { month: '6月', income: 35000, expenses: 6100 },
  { month: '7月', income: 58100, expenses: 7960 },
  { month: '8月', income: 64700, expenses: 8540 },
  { month: '9月', income: 40000, expenses: 5800 },
];

export default function Dashboard() {
  const { currentRole, currentLandlordId, properties, orders, expenses, repairs, disputes, bills } = useStore();

  const filteredProperties = currentRole === 'landlord'
    ? properties.filter((p) => p.landlordId === currentLandlordId)
    : properties;

  const propertyIds = filteredProperties.map((p) => p.id);
  const filteredOrders = orders.filter((o) => propertyIds.includes(o.propertyId));
  const filteredExpenses = expenses.filter((e) => propertyIds.includes(e.propertyId));
  const filteredRepairs = repairs.filter((r) => propertyIds.includes(r.propertyId));
  const filteredDisputes = currentRole === 'landlord'
    ? disputes.filter((d) => d.landlordId === currentLandlordId)
    : disputes;
  const filteredBills = bills.filter((b) => propertyIds.includes(b.propertyId));

  const totalIncome = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingDisputes = filteredDisputes.filter((d) => d.status === 'pending' || d.status === 'reviewing').length;

  const stats = [
    { icon: DollarSign, label: '总收入', value: formatCurrency(totalIncome), color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: ShoppingCart, label: '订单数', value: filteredOrders.length.toString(), color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Wrench, label: '维修工单', value: filteredRepairs.length.toString(), color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: MessageSquareWarning, label: '待处理异议', value: pendingDisputes.toString(), color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {currentRole === 'operator' ? '运营仪表盘' : currentRole === 'finance' ? '财务仪表盘' : '房东中心'}
        </h1>
        <p className="text-slate-500 mt-1">查看关键数据和待办事项</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">收入趋势</h2>
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <TrendingUp size={16} />
              <span>同比增长 23%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="income" name="收入" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="支出" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">房源概览</h2>
          <div className="space-y-4">
            {filteredProperties.slice(0, 4).map((property) => {
              const propertyOrders = filteredOrders.filter((o) => o.propertyId === property.id);
              const propertyIncome = propertyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
              const propertyBills = filteredBills.filter((b) => b.propertyId === property.id);
              const latestBill = propertyBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

              return (
                <div key={property.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Building2 className="text-teal-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{property.name}</p>
                    <p className="text-slate-500 text-xs">{property.bedrooms}室 · {propertyOrders.length}单</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 text-sm">{formatCurrency(propertyIncome)}</p>
                    {latestBill && (
                      <p className="text-xs text-slate-400">{latestBill.year}年{latestBill.month}月</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
