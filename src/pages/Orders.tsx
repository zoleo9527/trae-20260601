import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, platformNames } from '../data/mockData';

export default function Orders() {
  const { currentRole, currentLandlordId, orders, properties } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState<string>('all');

  const filteredProperties = currentRole === 'landlord'
    ? properties.filter((p) => p.landlordId === currentLandlordId)
    : properties;

  const propertyIds = filteredProperties.map((p) => p.id);
  let filteredOrders = orders.filter((o) => propertyIds.includes(o.propertyId));

  if (filterProperty !== 'all') {
    filteredOrders = filteredOrders.filter((o) => o.propertyId === filterProperty);
  }

  if (searchTerm) {
    filteredOrders = filteredOrders.filter((o) =>
      o.guestName.includes(searchTerm) ||
      properties.find((p) => p.id === o.propertyId)?.name.includes(searchTerm)
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">订单管理</h1>
        <p className="text-slate-500 mt-1">共 {filteredOrders.length} 条订单</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜索客人姓名或房源名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">全部房源</option>
            {filteredProperties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">订单信息</th>
                <th className="px-6 py-4 font-medium">房源</th>
                <th className="px-6 py-4 font-medium">入住日期</th>
                <th className="px-6 py-4 font-medium">晚数</th>
                <th className="px-6 py-4 font-medium">订单金额</th>
                <th className="px-6 py-4 font-medium">平台扣点</th>
                <th className="px-6 py-4 font-medium">退款</th>
                <th className="px-6 py-4 font-medium">实付</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const property = properties.find((p) => p.id === order.propertyId);
                const netAmount = order.totalAmount - order.platformFee - order.refundAmount;

                return (
                  <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">{order.guestName[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{order.guestName}</p>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                            {platformNames[order.platform]}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/properties/${order.propertyId}`} className="flex items-center gap-2 text-teal-600 hover:text-teal-700">
                        <Building2 size={14} />
                        <span className="truncate max-w-xs">{property?.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} />
                        <span>{order.checkIn}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{order.nights} 晚</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-6 py-4 text-amber-600">-{formatCurrency(order.platformFee)}</td>
                    <td className="px-6 py-4 text-rose-600">{order.refundAmount > 0 ? `-${formatCurrency(order.refundAmount)}` : '-'}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(netAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
