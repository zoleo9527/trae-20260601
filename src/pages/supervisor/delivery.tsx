import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge, AllergenBadge } from '@/components/StatusBadge';
import type { Delivery, OperationLog } from '@/types';

export default function SupervisorDelivery() {
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<string>('');
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<OperationLog[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [receivedBy, setReceivedBy] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, [selectedStore, selectedDate, status]);

  const fetchDeliveries = async () => {
    let url = `/api/deliveries?delivery_date=${selectedDate}`;
    if (selectedStore) {
      url += `&store_id=${selectedStore}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setDeliveries(data.data);
  };

  const generateDeliveries = async () => {
    if (!confirm('确定要为已完成的订单生成配送单吗？')) return;
    
    setLoading(true);
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: '生产班长' }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      alert(data.message || '配送单生成成功！');
      fetchDeliveries();
    } else {
      alert(data.error || '生成失败');
    }
  };

  const viewDeliveryDetail = async (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setReceivedBy('');
    setReceiveNotes('');
    
    const detailRes = await fetch(`/api/deliveries/${delivery.id}`);
    const detailData = await detailRes.json();
    if (detailData.success) {
      setSelectedDelivery(detailData.data);
    }
    
    const logsRes = await fetch(`/api/logs?entity_type=delivery&entity_id=${delivery.id}`);
    const logsData = await logsRes.json();
    if (logsData.success) setDeliveryLogs(logsData.data);
    
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
      alert('收货确认成功！');
      setShowModal(false);
      fetchDeliveries();
    } else {
      alert(data.error || '确认失败');
    }
  };

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    dispatched: deliveries.filter(d => d.status === 'dispatched').length,
    received: deliveries.filter(d => d.status === 'received').length,
  };

  return (
    <Layout currentRole="supervisor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">🚚 收货确认</h2>
          <button
            className="btn btn-primary"
            onClick={generateDeliveries}
            disabled={loading}
          >
            {loading ? '生成中...' : '生成配送单'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">总配送单</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">待发货</div>
              <div className="text-3xl font-bold text-gray-600">{stats.pending}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">配送中</div>
              <div className="text-3xl font-bold text-blue-600">{stats.dispatched}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">已收货</div>
              <div className="text-3xl font-bold text-green-600">{stats.received}</div>
            </div>
          </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  className="input w-48"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  className="select w-40"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">全部状态</option>
                  <option value="pending">待发货</option>
                  <option value="dispatched">配送中</option>
                  <option value="received">已收货</option>
                </select>
              </div>
              <button className="btn btn-secondary" onClick={fetchDeliveries}>
                查询
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无配送单，点击「生成配送单」创建
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>配送单ID</th>
                      <th>门店</th>
                      <th>菜品</th>
                      <th>数量</th>
                      <th>状态</th>
                      <th>发货时间</th>
                      <th>收货时间</th>
                      <th>收货人</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(delivery => (
                      <tr key={delivery.id}>
                        <td className="font-mono text-sm">#{delivery.id}</td>
                        <td className="font-medium">{delivery.store_name}</td>
                        <td>{delivery.dish_name}</td>
                        <td>{delivery.quantity} 份</td>
                        <td><StatusBadge status={delivery.status} /></td>
                        <td className="text-sm text-gray-500">
                          {delivery.dispatched_at || '-'}
                        </td>
                        <td className="text-sm text-gray-500">
                          {delivery.received_at || '-'}
                        </td>
                        <td className="text-sm">
                          {delivery.received_by || '-'}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => viewDeliveryDetail(delivery)}
                          >
                            {delivery.status === 'dispatched' ? '确认收货' : '查看详情'}
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

        {showModal && selectedDelivery && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="card-header flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  配送单 #{selectedDelivery.id} 详情
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">门店</div>
                    <div className="font-medium">{selectedDelivery.store_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">联系电话</div>
                    <div className="font-medium">{selectedDelivery.store_contact}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">菜品</div>
                    <div className="font-medium">{selectedDelivery.dish_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">规格</div>
                    <div className="font-medium">{selectedDelivery.specification}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">数量</div>
                    <div className="font-medium">{selectedDelivery.quantity} 份</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">状态</div>
                    <div><StatusBadge status={selectedDelivery.status} /></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">过敏原</div>
                    <div><AllergenBadge allergens={selectedDelivery.dish_allergens || ''} /></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">过敏原确认</div>
                    <div className="font-medium">{selectedDelivery.allergens_confirmation}</div>
                  </div>
                </div>

                {selectedDelivery.special_instructions && (
                  <div>
                    <div className="text-sm text-gray-500">特殊说明</div>
                    <div className="font-medium">{selectedDelivery.special_instructions}</div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">配送信息</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">发货时间</div>
                      <div className="font-medium">{selectedDelivery.dispatched_at || '未发货'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">收货时间</div>
                      <div className="font-medium">{selectedDelivery.received_at || '未收货'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">收货人</div>
                      <div className="font-medium">{selectedDelivery.received_by || '-'}</div>
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
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="请输入收货人姓名"
                          value={receivedBy}
                          onChange={(e) => setReceivedBy(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          备注
                        </label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="如有问题请备注"
                          value={receiveNotes}
                          onChange={(e) => setReceiveNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        className="btn btn-success"
                        onClick={confirmReceive}
                        disabled={loading}
                      >
                        {loading ? '确认中...' : '确认收货'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">操作日志（责任链路）</h4>
                  {deliveryLogs.length === 0 ? (
                    <div className="text-gray-500 text-sm">暂无操作日志</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {deliveryLogs.map(log => (
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

                {selectedDelivery.notes && (
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-500">配送单备注</div>
                    <div className="font-medium">{selectedDelivery.notes}</div>
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
