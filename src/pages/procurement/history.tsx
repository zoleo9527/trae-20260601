import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge, UrgentBadge } from '@/components/StatusBadge';
import type { DailyOrder } from '@/types';

export default function ProcurementHistory() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate]);

  const fetchHistory = async () => {
    const allOrders: DailyOrder[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const res = await fetch(`/api/orders?order_date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        allOrders.push(...data.data);
      }
      current.setDate(current.getDate() + 1);
    }

    setOrders(allOrders);
  };

  const stats = {
    totalOrders: orders.length,
    totalQuantity: orders.reduce((sum, o) => sum + o.quantity, 0),
    urgentCount: orders.filter(o => o.is_urgent).length,
  };

  return (
    <Layout currentRole="procurement">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">📜 采购历史记录</h2>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  className="input w-48"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  className="input w-48"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={fetchHistory}>
                查询
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">总报单数</div>
              <div className="text-3xl font-bold">{stats.totalOrders}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">总份数</div>
              <div className="text-3xl font-bold text-blue-600">{stats.totalQuantity}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">加急单</div>
              <div className="text-3xl font-bold text-red-600">{stats.urgentCount}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无历史数据
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>门店</th>
                      <th>菜品</th>
                      <th>数量</th>
                      <th>状态</th>
                      <th>加急</th>
                      <th>过敏原确认</th>
                      <th>创建人</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.order_date}</td>
                        <td className="font-medium">{order.store_name}</td>
                        <td>{order.dish_name}</td>
                        <td>{order.quantity} 份</td>
                        <td><StatusBadge status={order.status} /></td>
                        <td><UrgentBadge isUrgent={order.is_urgent} /></td>
                        <td className="text-sm text-gray-600">{order.allergens_confirmation}</td>
                        <td className="text-sm">{order.created_by}</td>
                        <td className="text-gray-500 text-sm">{order.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
