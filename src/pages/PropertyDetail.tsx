import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, BedDouble, Calendar, DollarSign, ShoppingCart, Wrench, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency, platformNames, expenseTypeNames, billStatusNames } from '../data/mockData';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { properties, orders, expenses, repairs, bills, landlords } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'expenses' | 'repairs' | 'bills'>('orders');

  const property = properties.find((p) => p.id === id);
  if (!property) return <div>房源不存在</div>;

  const landlord = landlords.find((l) => l.id === property.landlordId);
  const propertyOrders = orders.filter((o) => o.propertyId === id);
  const propertyExpenses = expenses.filter((e) => e.propertyId === id);
  const propertyRepairs = repairs.filter((r) => r.propertyId === id);
  const propertyBills = bills.filter((b) => b.propertyId === id);

  const monthlyIncome = [
    { month: '7月', income: propertyOrders.filter((o) => o.checkIn.startsWith('2024-07')).reduce((s, o) => s + o.totalAmount, 0) },
    { month: '8月', income: propertyOrders.filter((o) => o.checkIn.startsWith('2024-08')).reduce((s, o) => s + o.totalAmount, 0) },
    { month: '9月', income: propertyOrders.filter((o) => o.checkIn.startsWith('2024-09')).reduce((s, o) => s + o.totalAmount, 0) },
  ];

  const totalIncome = propertyOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalExpenses = propertyExpenses.reduce((s, e) => s + e.amount, 0);
  const totalRepairs = propertyRepairs.reduce((s, r) => s + r.cost, 0);

  const tabs = [
    { key: 'orders', label: '订单', icon: ShoppingCart, count: propertyOrders.length },
    { key: 'expenses', label: '费用', icon: DollarSign, count: propertyExpenses.length },
    { key: 'repairs', label: '维修', icon: Wrench, count: propertyRepairs.length },
    { key: 'bills', label: '账单', icon: FileText, count: propertyBills.length },
  ];

  return (
    <div className="p-8">
      <Link to="/properties" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={18} />
        <span>返回房源列表</span>
      </Link>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
          <div className="relative h-64">
            <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h1 className="text-2xl font-bold text-white">{property.name}</h1>
              <div className="flex items-center gap-4 text-white/80 mt-2">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{property.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BedDouble size={14} />
                  <span>{property.bedrooms} 室</span>
                </div>
              </div>
            </div>
          </div>
          {landlord && (
            <div className="p-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-teal-600 font-semibold">{landlord.name[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{landlord.name}</p>
                  <p className="text-slate-500 text-sm">{landlord.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">数据概览</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">订单总数</span>
              <span className="font-semibold text-slate-900">{propertyOrders.length} 单</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">订单收入</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">费用支出</span>
              <span className="font-semibold text-amber-600">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">维修支出</span>
              <span className="font-semibold text-rose-600">{formatCurrency(totalRepairs)}</span>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">净收入</span>
                <span className="font-bold text-teal-600 text-lg">{formatCurrency(totalIncome - totalExpenses - totalRepairs)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">月度收入趋势</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyIncome}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="income" stroke="#0d9488" strokeWidth={2} dot={{ fill: '#0d9488' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-sm">
                    <th className="pb-4 font-medium">客人</th>
                    <th className="pb-4 font-medium">平台</th>
                    <th className="pb-4 font-medium">入住日期</th>
                    <th className="pb-4 font-medium">晚数</th>
                    <th className="pb-4 font-medium">订单金额</th>
                    <th className="pb-4 font-medium">平台扣点</th>
                    <th className="pb-4 font-medium">退款</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyOrders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100">
                      <td className="py-4 font-medium text-slate-900">{order.guestName}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">{platformNames[order.platform]}</span>
                      </td>
                      <td className="py-4 text-slate-600 flex items-center gap-2">
                        <Calendar size={14} />
                        {order.checkIn}
                      </td>
                      <td className="py-4 text-slate-600">{order.nights}</td>
                      <td className="py-4 font-medium text-slate-900">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-4 text-amber-600">-{formatCurrency(order.platformFee)}</td>
                      <td className="py-4 text-rose-600">{order.refundAmount > 0 ? `-${formatCurrency(order.refundAmount)}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-sm">
                    <th className="pb-4 font-medium">日期</th>
                    <th className="pb-4 font-medium">类型</th>
                    <th className="pb-4 font-medium">描述</th>
                    <th className="pb-4 font-medium">金额</th>
                    <th className="pb-4 font-medium">录入人</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyExpenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-slate-100">
                      <td className="py-4 text-slate-600">{expense.date}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          expense.type === 'cleaning' ? 'bg-cyan-50 text-cyan-600' :
                          expense.type === 'utility' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {expenseTypeNames[expense.type]}
                        </span>
                      </td>
                      <td className="py-4 text-slate-600">{expense.description}</td>
                      <td className="py-4 font-medium text-rose-600">-{formatCurrency(expense.amount)}</td>
                      <td className="py-4 text-slate-500 text-sm">{expense.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'repairs' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-sm">
                    <th className="pb-4 font-medium">日期</th>
                    <th className="pb-4 font-medium">标题</th>
                    <th className="pb-4 font-medium">描述</th>
                    <th className="pb-4 font-medium">费用</th>
                    <th className="pb-4 font-medium">状态</th>
                    <th className="pb-4 font-medium">录入人</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyRepairs.map((repair) => (
                    <tr key={repair.id} className="border-t border-slate-100">
                      <td className="py-4 text-slate-600">{repair.date}</td>
                      <td className="py-4 font-medium text-slate-900">{repair.title}</td>
                      <td className="py-4 text-slate-600">{repair.description}</td>
                      <td className="py-4 font-medium text-rose-600">-{formatCurrency(repair.cost)}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          repair.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          repair.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {repair.status === 'completed' ? '已完成' : repair.status === 'in_progress' ? '进行中' : '待处理'}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 text-sm">{repair.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-sm">
                    <th className="pb-4 font-medium">账单月份</th>
                    <th className="pb-4 font-medium">订单收入</th>
                    <th className="pb-4 font-medium">费用支出</th>
                    <th className="pb-4 font-medium">维修支出</th>
                    <th className="pb-4 font-medium">净收入</th>
                    <th className="pb-4 font-medium">状态</th>
                    <th className="pb-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyBills.map((bill) => (
                    <tr key={bill.id} className="border-t border-slate-100">
                      <td className="py-4 font-medium text-slate-900">{bill.year}年{bill.month}月</td>
                      <td className="py-4 text-emerald-600">{formatCurrency(bill.totalIncome)}</td>
                      <td className="py-4 text-amber-600">-{formatCurrency(bill.totalExpenses)}</td>
                      <td className="py-4 text-rose-600">-{formatCurrency(bill.totalRepairs)}</td>
                      <td className="py-4 font-bold text-teal-600">{formatCurrency(bill.netAmount)}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          bill.status === 'settled' ? 'bg-emerald-50 text-emerald-600' :
                          bill.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                          bill.status === 'disputed' ? 'bg-rose-50 text-rose-600' :
                          bill.status === 'sent' ? 'bg-cyan-50 text-cyan-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {billStatusNames[bill.status]}
                        </span>
                      </td>
                      <td className="py-4">
                        <Link to={`/bills/${bill.id}`} className="text-teal-600 hover:text-teal-700 text-sm">
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
