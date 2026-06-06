import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Timeline } from '@/components/Timeline';
import { getAvailableActions } from '@/utils/permission';
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  MapPin,
  FileText,
  Send,
  MessageSquare,
  Check,
  Lock,
} from 'lucide-react';
import { PREPARATION_STATUS_MAP } from '@/types';
import type { PreparationOrderStatus, OperationLog, InventoryLock } from '@/types';

const STATUS_FLOW: PreparationOrderStatus[] = [
  'DRAFT',
  'PENDING_AUDIT',
  'AUDITING',
  'PENDING_SUPPLEMENT',
  'AUDIT_PASS',
  'WAREHOUSE_CONFIRM',
  'INVENTORY_LOCKED',
  'SHIPPED',
  'RECEIVED',
  'COMPLETED',
];

export const StockPreparationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getPreparationOrderById,
    getLogsByBiz,
    inventoryLocks,
    currentRole,
    updatePreparationStatus,
    addPreparationRemark,
  } = useStore();

  const order = id ? getPreparationOrderById(id) : undefined;
  const logs = id ? getLogsByBiz('preparation', id) : [];
  const relatedLocks = inventoryLocks.filter((l) => l.bizId === id);

  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FileText size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">备货单不存在或已被删除</p>
        <button
          onClick={() => navigate('/prep-orders')}
          className="text-blue-600 hover:text-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
  const availableActions = getAvailableActions(order.status, currentRole);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAction = async (toStatus: PreparationOrderStatus, action: string) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      updatePreparationStatus(id, toStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRemark = async () => {
    if (!id || !remark.trim()) return;
    setIsSubmitting(true);
    try {
      addPreparationRemark(id, remark.trim());
      setRemark('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timelineItems = logs.map((log: OperationLog) => {
    let color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' = 'blue';
    if (log.toStatus === 'CANCELLED') {
      color = 'red';
    } else if (
      log.toStatus === 'COMPLETED' ||
      log.toStatus === 'AUDIT_PASS' ||
      log.toStatus === 'INVENTORY_LOCKED'
    ) {
      color = 'green';
    } else if (log.toStatus === 'PENDING_SUPPLEMENT') {
      color = 'yellow';
    }

    return {
      id: log.id,
      title: log.operation,
      description: log.detail || log.remark,
      time: formatDate(log.operateAt),
      operator: log.operatorName,
      color,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/prep-orders')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNo}</h1>
            <StatusBadge status={order.status} type="preparation" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">处理进度</h3>
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${Math.max(
                  0,
                  (currentStatusIndex / (STATUS_FLOW.length - 1)) * 100
                )}%`,
              }}
            />
          </div>
          <div className="relative flex justify-between">
            {STATUS_FLOW.map((status, index) => {
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const config = PREPARATION_STATUS_MAP[status];

              return (
                <div key={status} className="flex flex-col items-center w-20">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 ${
                      isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : isActive
                        ? 'bg-blue-100 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isActive && !isCurrent ? (
                      <Check size={16} />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs text-center ${
                      isCurrent
                        ? 'font-medium text-blue-600'
                        : isActive
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Package size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">单号</p>
                  <p className="text-sm font-medium text-gray-900">{order.orderNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">仓库</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.warehouseName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">创建人</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.creatorName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">创建时间</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            {order.remark && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">备注</p>
                <p className="text-sm text-gray-700">{order.remark}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">商品明细</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      商品名称
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      数量
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      单价
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      金额
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.skuName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ¥{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        ¥{(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-sm font-medium text-gray-900"
                    >
                      合计
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {order.totalQuantity} 件
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">
                      -
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      ¥{order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {relatedLocks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock size={20} />
                关联库存锁定
              </h3>
              <div className="space-y-3">
                {relatedLocks.map((lock: InventoryLock) => (
                  <div
                    key={lock.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => navigate(`/stock-locks/${lock.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{lock.lockNo}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {lock.skuName} · {lock.lockQuantity} 件
                        </p>
                      </div>
                      <StatusBadge status={lock.status} type="inventory" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              添加备注
            </h3>
            <div className="space-y-3">
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="输入备注内容..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitRemark}
                  disabled={!remark.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                  提交备注
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">操作</h3>
            {availableActions.length === 0 ? (
              <p className="text-sm text-gray-500">当前状态无可用操作</p>
            ) : (
              <div className="space-y-2">
                {availableActions.map((action) => (
                  <button
                    key={action.to}
                    onClick={() => handleAction(action.to, action.action)}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                      action.to === 'CANCELLED'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    {action.action}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">操作日志</h3>
            <Timeline logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};
