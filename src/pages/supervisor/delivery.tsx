import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge, AllergenBadge } from '@/components/StatusBadge';
import type { OperationLog } from '@/types';

export default function SupervisorDelivery() {
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<OperationLog[]>([]);
  const [orderLogs, setOrderLogs] = useState<OperationLog[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [receivedBy, setReceivedBy] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    fetchDeliveries();
  }, [selectedStore, selectedDate, filterStatus]);

  const fetchDeliveries = async () => {
    let url = `/api/deliveries?delivery_date=${selectedDate}`;
    if (selectedStore) url += `&store_id=${selectedStore}`;
    if (filterStatus) url += `&status=${filterStatus}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      setDeliveries(data.data);
      setSelectedIds([]);
    }
  };

  const generateDeliveries = async () => {
    if (!confirm('确定要为生产完成的订单生成配送单吗？只有完成生产的订单才能生成配送单。')) return;
    setLoading(true);
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: '生产班长' }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert(data.message);
      fetchDeliveries();
    } else {
      alert(data.error);
    }
  };

  const dispatchDelivery = async (deliveryId: number) => {
    setLoading(true);
    const res = await fetch(`/api/deliveries/${deliveryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dispatched', operator: '生产班长' }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      fetchDeliveries();
    } else {
      alert(data.error);
    }
  };

  const batchDispatch = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    const res = await fetch('/api/deliveries/batch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, status: 'dispatched', operator: '生产班长' }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert(data.message);
      setSelectedIds([]);
      fetchDeliveries();
    } else {
      alert(data.error);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendingIds = deliveries.filter(d => d.status === 'pending').map(d => d.id);
    if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const viewDeliveryDetail = async (delivery: any) => {
    setReceivedBy('');
    setReceiveNotes('');

    const detailRes = await fetch(`/api/deliveries/${delivery.id}`);
    const detailData = await detailRes.json();
    if (detailData.success) setSelectedDelivery(detailData.data);

    const logsRes = await fetch(`/api/logs?entity_type=delivery&entity_id=${delivery.id}`);
    const logsData = await logsRes.json();
    if (logsData.success) setDeliveryLogs(logsData.data);

    if (detailData.data?.order_id) {
      const orderLogsRes = await fetch(`/api/logs?entity_type=daily_order&entity_id=${detailData.data.order_id}`);
      const orderLogsData = await orderLogsRes.json();
      if (orderLogsData.success) setOrderLogs(orderLogsData.data);
      else setOrderLogs([]);
    } else {
      setOrderLogs([]);
    }

    setShowModal(true);
  };

  const confirmReceive = async () => {
    if (!receivedBy.trim()) {
      alert('请填写收货人姓名');
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/deliveries/${selectedDelivery.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'received',
        received_by: receivedBy.trim(),
        notes: receiveNotes,
        operator: '门店督导',
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert('收货确认成功！收货人：' + receivedBy.trim());
      setShowModal(false);
      fetchDeliveries();
    } else {
      alert(data.error);
    }
  };

  const pendingCount = deliveries.filter(d => d.status === 'pending').length;
  const dispatchedCount = deliveries.filter(d => d.status === 'dispatched').length;
  const receivedCount = deliveries.filter(d => d.status === 'received').length;

  return (
    <Layout currentRole="supervisor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">🚚 收货确认</h2>
          <button className="btn btn-primary" onClick={generateDeliveries} disabled={loading}>
            {loading ? '生成中...' : '生成配送单'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-sm text-gray-500">待发货</div>
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-sm text-gray-500">配送中</div>
              <div className="text-3xl font-bold text-blue-600">{dispatchedCount}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-sm text-gray-500">已收货</div>
              <div className="text-3xl font-bold text-green-600">{receivedCount}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-sm text-gray-500">合计</div>
              <div className="text-3xl font-bold">{deliveries.length}</div>
            </div>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="card bg-blue-50 border-blue-300">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-medium">
                  已选择 {selectedIds.length} 条待发货配送单
                </span>
                <button className="btn btn-sm btn-primary" onClick={batchDispatch} disabled={loading}>
                  批量发货
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店</label>
                <select className="select w-48" value={selectedStore} onChange={e => setSelectedStore(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">全部门店</option>
                  <option value="1">朝阳门店</option>
                  <option value="2">海淀店</option>
                  <option value="3">西城店</option>
                  <option value="4">东城店</option>
                  <option value="5">丰台店</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input type="date" className="input w-48" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select className="select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">全部</option>
                  <option value="pending">待发货</option>
                  <option value="dispatched">配送中</option>
                  <option value="received">已收货</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无配送单，请先生成配送单</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {filterStatus === 'pending' || !filterStatus ? (
                          <input type="checkbox" className="h-4 w-4" checked={selectedIds.length === pendingCount && pendingCount > 0} onChange={toggleSelectAll} />
                        ) : null}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">门店</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">菜品</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">发货时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">收货人</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">收货时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deliveries.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {d.status === 'pending' ? (
                            <input type="checkbox" className="h-4 w-4" checked={selectedIds.includes(d.id)} onChange={() => toggleSelect(d.id)} />
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">#{d.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{d.store_name}</td>
                        <td className="px-4 py-3 text-sm">{d.dish_name}</td>
                        <td className="px-4 py-3 text-sm font-medium">{d.quantity} 份</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-500">{d.dispatched_at || '-'}</td>
                        <td className="px-4 py-3 text-sm">{d.received_by || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{d.received_at || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {d.status === 'pending' && (
                              <button className="btn btn-sm btn-primary" onClick={() => dispatchDelivery(d.id)} disabled={loading}>
                                发货
                              </button>
                            )}
                            <button className="btn btn-sm btn-secondary" onClick={() => viewDeliveryDetail(d)}>
                              {d.status === 'dispatched' ? '确认收货' : '详情'}
                            </button>
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

        {showModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">配送单 #{selectedDelivery.id} 详情</h3>
                <button className="text-gray-500 hover:text-gray-700 text-xl" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="px-6 py-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">门店</div>
                    <div className="font-medium">{selectedDelivery.store_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">联系电话</div>
                    <div className="font-medium">{selectedDelivery.store_contact}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">菜品</div>
                    <div className="font-medium">{selectedDelivery.dish_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">规格</div>
                    <div className="font-medium">{selectedDelivery.specification}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">数量</div>
                    <div className="font-medium">{selectedDelivery.quantity} 份</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">状态</div>
                    <div><StatusBadge status={selectedDelivery.status} /></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">过敏原</div>
                    <div><AllergenBadge allergens={selectedDelivery.dish_allergens || ''} /></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">过敏原确认</div>
                    <div className="font-medium">{selectedDelivery.allergens_confirmation}</div>
                  </div>
                </div>

                {selectedDelivery.special_instructions && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">特殊说明</div>
                    <div className="font-medium">{selectedDelivery.special_instructions}</div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">配送与收货信息</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">发货时间</div>
                      <div className="font-medium text-sm">{selectedDelivery.dispatched_at || '未发货'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">收货人</div>
                      <div className="font-medium">{selectedDelivery.received_by || '未签收'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">收货时间</div>
                      <div className="font-medium text-sm">{selectedDelivery.received_at || '未签收'}</div>
                    </div>
                  </div>
                </div>

                {selectedDelivery.status === 'dispatched' && (
                  <div className="border-t pt-4 bg-blue-50 -mx-6 px-6 pb-4">
                    <h4 className="font-semibold mb-3 text-blue-700">确认收货</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          收货人姓名 <span className="text-red-500">*</span>
                        </label>
                        <input type="text" className="input w-full" placeholder="请输入收货人姓名" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                        <input type="text" className="input w-full" placeholder="如有问题请备注" value={receiveNotes} onChange={e => setReceiveNotes(e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="btn btn-success" onClick={confirmReceive} disabled={loading || !receivedBy.trim()}>
                        {loading ? '确认中...' : '确认收货'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">配送单操作日志</h4>
                  {deliveryLogs.length === 0 ? (
                    <div className="text-gray-400 text-sm">暂无</div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {deliveryLogs.map(log => (
                        <div key={log.id} className="bg-gray-50 p-3 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{log.operation_type}</span>
                            <span className="text-gray-400">{log.timestamp}</span>
                          </div>
                          <div className="text-gray-600">操作人：{log.operator}</div>
                          {log.notes && <div className="text-gray-600">备注：{log.notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {orderLogs.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">关联订单日志</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {orderLogs.map(log => (
                        <div key={log.id} className="bg-yellow-50 p-3 rounded text-sm border border-yellow-200">
                          <div className="flex justify-between">
                            <span className="font-medium">{log.operation_type}</span>
                            <span className="text-gray-400">{log.timestamp}</span>
                          </div>
                          <div className="text-gray-600">操作人：{log.operator}</div>
                          {log.notes && <div className="text-gray-600">备注：{log.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDelivery.notes && (
                  <div className="border-t pt-4">
                    <div className="text-xs text-gray-500 mb-1">配送单备注</div>
                    <div className="font-medium text-sm">{selectedDelivery.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
