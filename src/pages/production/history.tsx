import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import type { ProductionSchedule, OperationLog } from '@/types';

export default function ProductionHistory() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState<ProductionSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ProductionSchedule | null>(null);
  const [scheduleLogs, setScheduleLogs] = useState<OperationLog[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate]);

  const fetchHistory = async () => {
    const allSchedules: ProductionSchedule[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const res = await fetch(`/api/schedules?schedule_date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        allSchedules.push(...data.data);
      }
      current.setDate(current.getDate() + 1);
    }

    setSchedules(allSchedules);
  };

  const viewScheduleDetail = async (schedule: ProductionSchedule) => {
    setSelectedSchedule(schedule);
    const logsRes = await fetch(`/api/logs?entity_type=production_schedule&entity_id=${schedule.id}`);
    const logsData = await logsRes.json();
    if (logsData.success) setScheduleLogs(logsData.data);
    setShowModal(true);
  };

  const stats = {
    total: schedules.length,
    completed: schedules.filter(s => s.status === 'completed').length,
    totalQuantity: schedules.reduce((sum, s) => sum + s.total_quantity, 0),
  };

  return (
    <Layout currentRole="production">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">📋 生产历史回看</h2>
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
              <div className="text-sm text-gray-500">总排程数</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">已完成</div>
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">总产量</div>
              <div className="text-3xl font-bold text-blue-600">{stats.totalQuantity} 份</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无历史数据
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>菜品</th>
                      <th>分类</th>
                      <th>数量</th>
                      <th>状态</th>
                      <th>负责人</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map(schedule => (
                      <tr key={schedule.id}>
                        <td>{schedule.schedule_date}</td>
                        <td className="font-medium">{schedule.dish_name}</td>
                        <td>{schedule.dish_category}</td>
                        <td>{schedule.total_quantity} 份</td>
                        <td><StatusBadge status={schedule.status} /></td>
                        <td>{schedule.assigned_to || '-'}</td>
                        <td className="text-gray-500 text-sm">{schedule.created_at}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => viewScheduleDetail(schedule)}
                          >
                            详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showModal && selectedSchedule && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="card-header flex items-center justify-between">
                <h3 className="text-lg font-semibold">排程详情</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">日期</div>
                    <div className="font-medium">{selectedSchedule.schedule_date}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">菜品</div>
                    <div className="font-medium">{selectedSchedule.dish_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">分类</div>
                    <div className="font-medium">{selectedSchedule.dish_category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">数量</div>
                    <div className="font-medium">{selectedSchedule.total_quantity} 份</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">状态</div>
                    <div><StatusBadge status={selectedSchedule.status} /></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">负责人</div>
                    <div className="font-medium">{selectedSchedule.assigned_to || '-'}</div>
                  </div>
                </div>
                {selectedSchedule.notes && (
                  <div>
                    <div className="text-sm text-gray-500">备注</div>
                    <div className="font-medium">{selectedSchedule.notes}</div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">操作日志</h4>
                  {scheduleLogs.length === 0 ? (
                    <div className="text-gray-500 text-sm">暂无操作日志</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {scheduleLogs.map(log => (
                        <div key={log.id} className="bg-gray-50 p-3 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{log.operation_type}</span>
                            <span className="text-gray-500">{log.timestamp}</span>
                          </div>
                          <div className="text-gray-600">操作人：{log.operator}</div>
                          {log.notes && <div className="text-gray-600">备注：{log.notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
