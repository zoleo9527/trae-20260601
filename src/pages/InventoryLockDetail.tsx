import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Package, User, Calendar, MapPin, FileText, Clock, MessageSquare } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Timeline } from '@/components/Timeline';
import { hasPermission, getLockAvailableActions } from '@/utils/permission';
import type { InventoryLockStatus } from '@/types';

const InventoryLockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInventoryLockById, getPreparationOrderById, getLogsByBiz, currentRole, releaseInventoryLock } = useStore();

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');

  const lock = id ? getInventoryLockById(id) : undefined;
  const preparationOrder = lock?.bizType === 'preparation' && lock.bizId 
    ? getPreparationOrderById(lock.bizId) 
    : undefined;
  const logs = id ? getLogsByBiz('inventory_lock', id) : [];

  if (!lock) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">锁定单不存在</p>
        <button
          onClick={() => navigate('/inventory-lock')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          返回列表
        </button>
      </div>
    );
  }

  const availableActions = getLockAvailableActions(lock.status, currentRole);
  const canRelease = hasPermission('inventoryLock', 'release', currentRole) && 
    availableActions.some(a => a.to === 'RELEASED');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRelease = () => {
    if (!releaseReason.trim()) return;
    releaseInventoryLock(lock.id, releaseReason);
    setShowReleaseModal(false);
    setReleaseReason('');
  };

  const getBizTypeLabel = (bizType: string) => {
    const map: Record<string, string> = {
      preparation: '备货单',
      order: '订单',
      return: '退件',
    };
    return map[bizType] || bizType;
  };

  const timelineItems = logs.map(log => ({
    id: log.id,
    title: log.operation,
    time: formatDate(log.operateAt),
    operator: log.operatorName,
    description: log.detail,
    remark: log.remark,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/inventory-lock')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">库存锁定详情</h1>
          <p className="text-gray-500 mt-1">锁定单号：{lock.lockNo}</p>
        </div>
        <StatusBadge status={lock.status} type="inventory" />
      </div>

      {availableActions.length > 0 && (
        <div className="flex gap-3">
          {canRelease && (
            <button
              onClick={() => setShowReleaseModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              释放锁定
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                锁定基本信息
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">锁定单号</p>
                      <p className="text-sm font-medium text-gray-900">{lock.lockNo}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">SKU</p>
                      <p className="text-sm font-medium text-gray-900">{lock.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">商品名称</p>
                      <p className="text-sm font-medium text-gray-900">{lock.skuName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">锁定数量</p>
                      <p className="text-sm font-medium text-gray-900">{lock.lockQuantity} 件</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">锁定人</p>
                      <p className="text-sm font-medium text-gray-900">{lock.lockerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">所属仓库</p>
                      <p className="text-sm font-medium text-gray-900">{lock.warehouseName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">创建时间</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(lock.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">过期时间</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(lock.expireAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
              {lock.remark && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">备注</p>
                      <p className="text-sm text-gray-900 mt-1">{lock.remark}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {lock.bizType === 'preparation' && preparationOrder && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  关联备货单
                  <span className="text-sm font-normal text-gray-500">（跨模块流转数据）</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <Link 
                      to={`/preparation/${lock.bizId}`}
                      className="text-lg font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                    >
                      {preparationOrder.orderNo}
                    </Link>
                    <StatusBadge status={preparationOrder.status} type="preparation" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">创建人</p>
                      <p className="font-medium text-gray-900">{preparationOrder.creatorName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">商品数量</p>
                      <p className="font-medium text-gray-900">{preparationOrder.totalQuantity} 件</p>
                    </div>
                    <div>
                      <p className="text-gray-500">创建时间</p>
                      <p className="font-medium text-gray-900">{formatDate(preparationOrder.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {preparationOrder.remark && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 mb-1">备货单同步备注</p>
                        <p className="text-sm text-amber-700">{preparationOrder.remark}</p>
                        <p className="text-xs text-amber-600 mt-2">
                          此备注从备货单 {preparationOrder.orderNo} 同步而来，用于跨模块业务流转
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">备货商品明细</p>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">数量</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">单价</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preparationOrder.items.map(item => (
                          <tr key={item.id} className={item.sku === lock.sku ? 'bg-blue-50' : ''}>
                            <td className="px-4 py-2 text-gray-900">{item.sku}</td>
                            <td className="px-4 py-2 text-gray-900">{item.skuName}</td>
                            <td className="px-4 py-2 text-right text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-right text-gray-900">¥{item.unitPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-600" />
                全链路操作历史
              </h2>
            </div>
            <div className="p-6">
              <Timeline logs={logs} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">关联业务</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">业务类型</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{getBizTypeLabel(lock.bizType)}</p>
                </div>
                {lock.bizNo && (
                  <Link
                    to={lock.bizType === 'preparation' ? `/preparation/${lock.bizId}` : '#'}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {lock.bizNo} →
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">状态流转</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(['PENDING', 'LOCKED', 'RELEASED', 'EXPIRED'] as InventoryLockStatus[]).map((status, index) => {
                  const statusConfig = {
                    PENDING: { label: '待锁定', color: 'yellow' },
                    LOCKED: { label: '已锁定', color: 'blue' },
                    RELEASED: { label: '已释放', color: 'gray' },
                    EXPIRED: { label: '已过期', color: 'red' },
                  }[status];
                  const isActive = lock.status === status;
                  const isPast = (
                    (lock.status === 'LOCKED' && status === 'PENDING') ||
                    (lock.status === 'RELEASED' && ['PENDING', 'LOCKED'].includes(status)) ||
                    (lock.status === 'EXPIRED' && ['PENDING', 'LOCKED'].includes(status))
                  );
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        isActive ? `bg-${statusConfig.color}-500 ring-4 ring-${statusConfig.color}-100` :
                        isPast ? `bg-${statusConfig.color}-300` : 'bg-gray-200'
                      }`} />
                      <span className={`text-sm ${isActive ? 'font-medium text-gray-900' : isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReleaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">释放锁定</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                确定要释放库存锁定 <span className="font-medium text-gray-900">{lock.lockNo}</span> 吗？
                释放后库存将恢复可用。
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  释放原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="请输入释放原因..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReleaseModal(false);
                  setReleaseReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRelease}
                disabled={!releaseReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认释放
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryLockDetail;
