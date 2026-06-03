import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import type { ProductionSchedule, DailyOrder } from '@/types';

export default function ProductionSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState<ProductionSchedule[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchOrders();
  }, [selectedDate]);

  const fetchSchedules = async () => {
    const res = await fetch(`/api/schedules?schedule_date=${selectedDate}`);
    const data = await res.json();
    if (data.success) setSchedules(data.data);
  };

  const fetchOrders = async () => {
    const res = await fetch(`/api/orders?order_date=${selectedDate}`);
    const data = await res.json();
    if (data.success) setOrders(data.data);
  };

  const generateSchedule = async () => {
    if (orders.length === 0) {
      alert('该日期暂无报单数据');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schedule_date: selectedDate,
        operator: '生产班长',
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      alert('生产排程生成成功！');
      fetchSchedules();
    } else {
      alert(data.error || '生成失败');
    }
  };

  const toggleSelectSchedule = (scheduleId: number) => {
    setSelectedSchedules(prev =>
      prev.includes(scheduleId)
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const selectAllSchedules = () => {
    if (selectedSchedules.length === schedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(schedules.map(s => s.id));
    }
  };

  const batchUpdateStatus = async (status: string) => {
    if (selectedSchedules.length === 0) {
      alert('请选择要处理的排程');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/schedules/batch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: selectedSchedules,
        status,
        operator: '生产班长',
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      alert(data.message);
      setSelectedSchedules([]);
      fetchSchedules();
    } else {
      alert(data.error || '操作失败');
    }
  };

  const updateScheduleStatus = async (scheduleId: number, status: string) => {
    setLoading(true);
    const res = await fetch(`/api/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        operator: '生产班长',
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      fetchSchedules();
    } else {
      alert(data.error || '操作失败');
    }
  };

  return (
    <Layout currentRole="production">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">📅 生产排程</h2>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={generateSchedule}
              disabled={loading}
            >
              {loading ? '生成中...' : '生成排程'}
            </button>
          </div>
        </div>

        {orders.length > 0 && schedules.length === 0 && (
          <div className="card bg-yellow-50 border-yellow-300">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-yellow-700">
                    今日有 {orders.length} 条报单，点击「生成排程」创建生产计划
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSchedules.length > 0 && (
          <div className="card bg-blue-50 border-blue-300">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">
                  已选择 {selectedSchedules.length} 条排程
                </span>
                <div className="flex space-x-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => batchUpdateStatus('in_progress')}
                  >
                    开始生产
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => batchUpdateStatus('completed')}
                  >
                    完成生产
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无生产排程，请先生成排程
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedSchedules.length === schedules.length && schedules.length > 0}
                          onChange={selectAllSchedules}
                        />
                      </th>
                      <th>菜品</th>
                      <th>分类</th>
                      <th>总数量</th>
                      <th>状态</th>
                      <th>负责人</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map(schedule => (
                      <tr key={schedule.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedSchedules.includes(schedule.id)}
                            onChange={() => toggleSelectSchedule(schedule.id)}
                          />
                        </td>
                        <td className="font-medium">{schedule.dish_name}</td>
                        <td>{schedule.dish_category}</td>
                        <td className="text-lg font-bold">{schedule.total_quantity} 份</td>
                        <td><StatusBadge status={schedule.status} /></td>
                        <td>{schedule.assigned_to || '-'}</td>
                        <td className="text-gray-500 text-sm">{schedule.created_at}</td>
                        <td>
                          <div className="flex space-x-2">
                            {schedule.status === 'scheduled' && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => updateScheduleStatus(schedule.id, 'in_progress')}
                              >
                                开始
                              </button>
                            )}
                            {schedule.status === 'in_progress' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => updateScheduleStatus(schedule.id, 'completed')}
                              >
                                完成
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">今日报单明细</h3>
          </div>
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="text-center py-4 text-gray-500">暂无报单</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(
                  orders.reduce((acc, order) => {
                    if (!acc[order.dish_name!]) acc[order.dish_name!] = 0;
                    acc[order.dish_name!] += order.quantity;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([dishName, quantity]) => (
                  <div key={dishName} className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold">{quantity}</div>
                    <div className="text-sm text-gray-600">{dishName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
