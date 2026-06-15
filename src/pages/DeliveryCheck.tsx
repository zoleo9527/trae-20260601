import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Package, CheckCircle, Clock, AlertTriangle, Calendar, User, FileText, Plus } from 'lucide-react';
import { useStore } from '../store';
import { DeliveryRecord as DeliveryRecordType } from '../types';

const statusConfig = {
  pending: { label: '待交付', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  delivered: { label: '已交付', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  repair: { label: '返修', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

export default function DeliveryCheck() {
  const { id } = useParams<{ id: string }>();
  const { getOrderById, addDeliveryRecord, updateOrderStatus, currentUser } = useStore();
  const order = getOrderById(id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Omit<DeliveryRecordType, 'id' | 'created_at'>>({
    order_id: id || '',
    status: 'pending',
    delivery_date: '',
    signer: '',
    remarks: '',
  });

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }

  const latestDelivery = order.delivery_records[order.delivery_records.length - 1];
  const hasDelivered = order.delivery_records.some((record) => record.status === 'delivered');
  const hasRepair = order.delivery_records.some((record) => record.status === 'repair');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.status || (formData.status === 'delivered' && (!formData.delivery_date || !formData.signer))) {
      return;
    }

    addDeliveryRecord(order.id, formData);
    
    if (formData.status === 'delivered') {
      updateOrderStatus(order.id, 'delivered');
    } else if (formData.status === 'repair') {
      updateOrderStatus(order.id, 'repairing');
    }

    setShowAddModal(false);
    setFormData({
      order_id: order.id,
      status: 'pending',
      delivery_date: '',
      signer: '',
      remarks: '',
    });
  };

  const handleStatusChange = (status: DeliveryRecordType['status']) => {
    setFormData((prev) => ({ ...prev, status }));
    if (status === 'repair') {
      setFormData((prev) => ({ ...prev, delivery_date: new Date().toISOString().split('T')[0], remarks: '客户反馈设备故障，需返修' }));
    } else if (status === 'delivered') {
      setFormData((prev) => ({ ...prev, delivery_date: new Date().toISOString().split('T')[0] }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">订单状态</p>
              <p className="text-xl font-bold text-gray-800">
                {order.status === 'pending' && '待确认'}
                {order.status === 'installing' && '待装机'}
                {order.status === 'delivered' && '已交付'}
                {order.status === 'repairing' && '返修中'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              order.status === 'delivered' ? 'bg-green-100' : 
              order.status === 'repairing' ? 'bg-red-100' : 
              order.status === 'installing' ? 'bg-blue-100' : 'bg-yellow-100'
            }`}>
              {order.status === 'delivered' && <CheckCircle className="w-6 h-6 text-green-600" />}
              {order.status === 'repairing' && <AlertTriangle className="w-6 h-6 text-red-600" />}
              {order.status === 'installing' && <Clock className="w-6 h-6 text-blue-600" />}
              {order.status === 'pending' && <Clock className="w-6 h-6 text-yellow-600" />}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">交付次数</p>
              <p className="text-xl font-bold text-blue-600">{order.delivery_records.length} 次</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">返修次数</p>
              <p className="text-xl font-bold text-red-600">{hasRepair ? 1 : 0} 次</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${hasRepair ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${hasRepair ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">交付记录</h2>
            <p className="text-sm text-gray-500 mt-1">订单号：{order.id}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加记录
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {order.delivery_records.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无交付记录</p>
            </div>
          ) : (
            order.delivery_records.map((record, index) => {
              const StatusIcon = statusConfig[record.status].icon;
              const statusColor = statusConfig[record.status].color;
              const statusLabel = statusConfig[record.status].label;

              return (
                <div key={record.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColor}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        {index < order.delivery_records.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 my-2" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                          <span className="text-sm text-gray-400">#{index + 1}</span>
                        </div>
                        {record.delivery_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                            <Calendar className="w-4 h-4" />
                            <span>{record.delivery_date}</span>
                          </div>
                        )}
                        {record.signer && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <User className="w-4 h-4" />
                            <span>签收人：{record.signer}</span>
                          </div>
                        )}
                        {record.remarks && (
                          <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{record.remarks}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">记录时间：{record.created_at}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">添加交付记录</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">记录类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(statusConfig).map(([key, value]) => {
                    const Icon = value.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleStatusChange(key as DeliveryRecordType['status'])}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                          formData.status === key
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm">{value.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.status === 'delivered' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">交付日期</label>
                    <input
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, delivery_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">签收人</label>
                    <input
                      type="text"
                      value={formData.signer}
                      onChange={(e) => setFormData((prev) => ({ ...prev, signer: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入签收人姓名"
                    />
                  </div>
                </>
              )}

              {formData.status === 'repair' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">返修原因</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="请描述返修原因，如：蓝屏、无法开机等..."
                  />
                </div>
              )}

              {formData.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="请输入备注信息..."
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-colors ${
                    formData.status === 'delivered' ? 'bg-green-600 text-white' :
                    formData.status === 'repair' ? 'bg-red-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
