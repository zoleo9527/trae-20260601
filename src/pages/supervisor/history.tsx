import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge, UrgentBadge, AllergenBadge } from '@/components/StatusBadge';
import type { DailyOrder, OperationLog } from '@/types';

export default function SupervisorHistory() {
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DailyOrder | null>(null);
  const [orderLogs, setOrderLogs] = useState<OperationLog[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [selectedStore, startDate, endDate]);

  const fetchHistory = async () => {
    let url = `/api/orders?start_date=${startDate}&end_date=${endDate}`;
    if (selectedStore) {
      url += `&store_id=${selectedStore}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setOrders(data.data);
  };

  const viewOrderDetail = async (order: DailyOrder) => {
    setSelectedOrder(order);
    const logsRes = await fetch(`/api/logs?entity_type=daily_order&entity_id=${order.id}`);
    const logsData = await logsRes.json();
    if (logsData.success) setOrderLogs(logsData.data);
    setShowModal(true);
  };

  return (
    <Layout currentRole="supervisor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">📋 报单历史记录</h2>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店</label>
                <select
                  className="select w-48"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">全部门店</option>
                  <option value="1">朝阳门店</option>
                  <option value="2">海淀店</option>
                  <option value="3">西城店</option>
                  <option value="4">东城店</option>
                  <option value="5">丰台店</option>
                </select>
              </div>
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
                      <th>过敏原</th>
                      <th>创建人</th>
                      <th>创建时间</th>
                      <th>操作</th>
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
                        <td><AllergenBadge allergens={order.dish_allergens || ''} /></td>
                        <td className="text-sm">{order.created_by}</td>
                        <td className="text-gray-500 text-sm">{order.created_at}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => viewOrderDetail(order)}
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

        {showModal && selectedOrder && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="card-header flex items-center justify-between">
                <h3 className="text-lg font-semibold">报单详情</h3>
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
                    <div className="text-sm text-gray-500">门店</div>
                    <div className="font-medium">{selectedOrder.store_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">日期</div>
                    <div className="font-medium">{selectedOrder.order_date}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">菜品</div>
                    <div className="font-medium">{selectedOrder.dish_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">数量</div>
                    <div className="font-medium">{selectedOrder.quantity} 份</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">状态</div>
                    <div><StatusBadge status={selectedOrder.status} /></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">加急</div>
                    <div><UrgentBadge isUrgent={selectedOrder.is_urgent} /></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">过敏原确认</div>
                  <div className="font-medium">{selectedOrder.allergens_confirmation}</div>
                </div>
                {selectedOrder.special_instructions && (
                  <div>
                    <div className="text-sm text-gray-500">特殊说明</div>
                    <div className="font-medium">{selectedOrder.special_instructions}</div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">操作日志</h4>
                  {orderLogs.length === 0 ? (
                    <div className="text-gray-500 text-sm">暂无操作日志</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {orderLogs.map(log => (
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
