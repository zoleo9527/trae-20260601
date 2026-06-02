import { Filter, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api';
import StatusBadge, { STATUS_MAP } from '../components/StatusBadge';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const data = await ordersApi.list(params);
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusFilters = [
    { value: 'all', label: '全部' },
    ...Object.entries(STATUS_MAP).map(([value, { label }]) => ({ value, label })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">订单管理</h2>
        <p className="text-gray-500 mt-1">管理广告订单的全生命周期</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、客户、品牌、销售..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">暂无订单</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">订单号</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">客户/品牌</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">销售</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">金额</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">素材</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">更新时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-primary-600">{order.order_no}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{order.client_name}</p>
                    <p className="text-xs text-gray-500">{order.brand}{order.product ? ` · ${order.product}` : ''}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{order.sales_person}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-900">
                    ¥{order.total_amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{order.material_count}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{order.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
