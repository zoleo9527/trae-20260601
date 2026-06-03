import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge, UrgentBadge } from '@/components/StatusBadge';
import type { ProductionSchedule, DailyOrder } from '@/types';

export default function ProductionBoard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState<ProductionSchedule[]>([]);
  const [urgentOrders, setUrgentOrders] = useState<DailyOrder[]>([]);

  useEffect(() => {
    fetchSchedules();
    fetchUrgentOrders();
  }, [selectedDate]);

  const fetchSchedules = async () => {
    const res = await fetch(`/api/schedules?schedule_date=${selectedDate}`);
    const data = await res.json();
    if (data.success) setSchedules(data.data);
  };

  const fetchUrgentOrders = async () => {
    const res = await fetch(`/api/orders?is_urgent=true&order_date=${selectedDate}`);
    const data = await res.json();
    if (data.success) setUrgentOrders(data.data);
  };

  const getSchedulesByStatus = (status: string) => {
    return schedules.filter(s => s.status === status);
  };

  const totalQuantity = schedules.reduce((sum, s) => sum + s.total_quantity, 0);
  const completedQuantity = schedules
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.total_quantity, 0);
  const progress = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0;

  return (
    <Layout currentRole="production">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">📊 生产看板</h2>
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">待生产</div>
              <div className="text-3xl font-bold text-gray-800">
                {getSchedulesByStatus('scheduled').length}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">生产中</div>
              <div className="text-3xl font-bold text-purple-600">
                {getSchedulesByStatus('in_production').length}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">已完成</div>
              <div className="text-3xl font-bold text-green-600">
                {getSchedulesByStatus('completed').length}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">完成进度</div>
              <div className="text-3xl font-bold text-blue-600">{progress}%</div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {urgentOrders.length > 0 && (
          <div className="card border-red-300 bg-red-50">
            <div className="card-header border-red-300">
              <h3 className="text-lg font-semibold text-red-700">⚡ 加急订单 - 优先处理</h3>
            </div>
            <div className="card-body">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>门店</th>
                      <th>菜品</th>
                      <th>数量</th>
                      <th>状态</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentOrders.map(order => (
                      <tr key={order.id}>
                        <td className="font-medium">{order.store_name}</td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <span>{order.dish_name}</span>
                            <UrgentBadge isUrgent={true} />
                          </div>
                        </td>
                        <td>{order.quantity} 份</td>
                        <td><StatusBadge status={order.status} /></td>
                        <td className="text-gray-500 text-sm">{order.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header bg-gray-50">
              <h3 className="font-semibold">待生产 ({getSchedulesByStatus('scheduled').length})</h3>
            </div>
            <div className="card-body space-y-3 max-h-96 overflow-y-auto">
              {getSchedulesByStatus('scheduled').map(schedule => (
                <div key={schedule.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">{schedule.dish_name}</div>
                  <div className="text-sm text-gray-600">
                    {schedule.total_quantity} 份 · {schedule.dish_category}
                  </div>
                </div>
              ))}
              {getSchedulesByStatus('scheduled').length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">无</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-purple-50">
              <h3 className="font-semibold text-purple-700">
                生产中 ({getSchedulesByStatus('in_production').length})
              </h3>
            </div>
            <div className="card-body space-y-3 max-h-96 overflow-y-auto">
              {getSchedulesByStatus('in_production').map(schedule => (
                <div key={schedule.id} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="font-medium">{schedule.dish_name}</div>
                  <div className="text-sm text-gray-600">
                    {schedule.total_quantity} 份 · {schedule.dish_category}
                  </div>
                  <div className="mt-2 bg-purple-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              ))}
              {getSchedulesByStatus('in_production').length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">无</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-green-50">
              <h3 className="font-semibold text-green-700">
                已完成 ({getSchedulesByStatus('completed').length})
              </h3>
            </div>
            <div className="card-body space-y-3 max-h-96 overflow-y-auto">
              {getSchedulesByStatus('completed').map(schedule => (
                <div key={schedule.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="font-medium text-green-700">✓ {schedule.dish_name}</div>
                  <div className="text-sm text-gray-600">
                    {schedule.total_quantity} 份 · {schedule.dish_category}
                  </div>
                </div>
              ))}
              {getSchedulesByStatus('completed').length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">无</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
