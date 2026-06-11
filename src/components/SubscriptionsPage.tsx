'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  getSubscriptions,
  getSubscriptionMaterials,
  updateSubscription,
} from '@/services/dataService';
import type { Subscription, SubscriptionMaterial, FilterOptions } from '@/types';
import { formatDate, getDaysLeft } from '@/components/ListItems';

interface SubscriptionsPageProps {
  selectedId?: string;
  onNavigate: (tab: string, id?: string) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  confirmed: { label: '已确认', color: 'bg-success-100 text-success-600' },
  modified: { label: '已修改', color: 'bg-warning-100 text-warning-600' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-400' },
};

const materialStatusLabels: Record<string, { label: string; color: string }> = {
  incomplete: { label: '资料不全', color: 'bg-gray-100 text-gray-600' },
  submitted: { label: '待审核', color: 'bg-primary-100 text-primary-600' },
  verified: { label: '已通过', color: 'bg-success-100 text-success-600' },
  returned: { label: '被退回', color: 'bg-danger-100 text-danger-600' },
};

const urgencyLabels: Record<string, { label: string; color: string }> = {
  normal: { label: '正常', color: 'bg-gray-100 text-gray-600' },
  urgent: { label: '紧急', color: 'bg-warning-100 text-warning-600' },
  critical: { label: '危急', color: 'bg-danger-100 text-danger-600' },
};

export default function SubscriptionsPage({
  selectedId,
  onNavigate,
}: SubscriptionsPageProps) {
  const { currentUser, refreshTrigger, triggerRefresh } = useApp();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState<FilterOptions>({});
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [materials, setMaterials] = useState<SubscriptionMaterial[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ unitNo: '', price: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser, refreshTrigger, filter]);

  useEffect(() => {
    if (selectedSub) {
      loadMaterials(selectedSub.id);
    }
  }, [selectedSub]);

  const loadData = async () => {
    setLoading(true);
    let data = await getSubscriptions(filter);

    if (currentUser.role === 'consultant') {
      data = data.filter((s) => s.consultantId === currentUser.id);
    } else if (currentUser.role === 'controller') {
      data = data.filter((s) => s.controllerId === currentUser.id);
    }

    setSubscriptions(data);
    if (data.length > 0 && !selectedSub) {
      setSelectedSub(data[0]);
    }
    setLoading(false);
  };

  const loadMaterials = async (subId: string) => {
    const data = await getSubscriptionMaterials(subId);
    setMaterials(data);
  };

  const handleEdit = () => {
    if (!selectedSub) return;
    setEditData({ unitNo: selectedSub.unitNo, price: selectedSub.price });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSub) return;

    await updateSubscription(
      selectedSub.id,
      { unitNo: editData.unitNo, price: editData.price, status: 'modified' },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setShowEditModal(false);
    triggerRefresh();
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-64px)]">
      <div className="w-96 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">认购单列表</h3>
          <input
            type="text"
            placeholder="搜索客户/房号/认购号..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filter.keyword || ''}
            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
          />
          <div className="flex gap-2 mt-2">
            <select
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600"
              value={filter.status || 'all'}
              onChange={(e) =>
                setFilter({ ...filter, status: e.target.value })
              }
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="confirmed">已确认</option>
              <option value="modified">已修改</option>
            </select>
            <select
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600"
              value={filter.urgency || 'all'}
              onChange={(e) =>
                setFilter({ ...filter, urgency: e.target.value })
              }
            >
              <option value="all">全部紧急度</option>
              <option value="critical">危急</option>
              <option value="urgent">紧急</option>
              <option value="normal">正常</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : subscriptions.length > 0 ? (
            subscriptions.map((sub) => {
              const daysInfo = getDaysLeft(sub.signDeadline);
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all border ${
                    selectedSub?.id === sub.id
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${
                    sub.urgency === 'critical'
                      ? 'border-l-4 border-l-danger-500'
                      : sub.urgency === 'urgent'
                      ? 'border-l-4 border-l-warning-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {sub.customerName}
                        </span>
                        {sub.modifiedCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-warning-100 text-warning-600 rounded">
                            改{sub.modifiedCount}次
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {sub.unitNo}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {sub.subscriptionNo}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-medium ${daysInfo.color}`}
                      >
                        {daysInfo.label}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                          materialStatusLabels[sub.materialStatus]?.color
                        }`}
                      >
                        {materialStatusLabels[sub.materialStatus]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">📋</div>
              <div>暂无认购单</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5 overflow-y-auto scrollbar-thin">
        {selectedSub ? (
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedSub.subscriptionNo}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-sm ${
                      statusLabels[selectedSub.status]?.color
                    }`}
                  >
                    {statusLabels[selectedSub.status]?.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-sm ${
                      urgencyLabels[selectedSub.urgency]?.color
                    }`}
                  >
                    {urgencyLabels[selectedSub.urgency]?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  创建时间: {formatDate(selectedSub.createdAt)}
                </p>
              </div>
              {currentUser.role !== 'controller' && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  修改认购单
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">客户信息</div>
                <div className="font-medium text-gray-800 mt-1">
                  {selectedSub.customerName}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedSub.phone}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">房屋信息</div>
                <div className="font-medium text-gray-800 mt-1">
                  {selectedSub.unitNo}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedSub.area} ㎡
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">认购金额</div>
                <div className="font-medium text-gray-800 mt-1">
                  ¥{selectedSub.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  定金: ¥{selectedSub.deposit.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">签约截止</div>
                <div
                  className={`font-medium mt-1 ${
                    getDaysLeft(selectedSub.signDeadline).color
                  }`}
                >
                  {getDaysLeft(selectedSub.signDeadline).label}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatDate(selectedSub.signDeadline)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-500">置业顾问</div>
                <div className="font-medium text-blue-700 mt-1">
                  {selectedSub.consultantName}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-500">销控专员</div>
                <div className="font-medium text-purple-700 mt-1">
                  {selectedSub.controllerName}
                </div>
              </div>
            </div>

            {selectedSub.modifiedCount > 0 && (
              <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-warning-600">⚠️</span>
                  <span className="font-medium text-warning-700">
                    此认购单已被修改 {selectedSub.modifiedCount} 次
                  </span>
                </div>
                <p className="text-sm text-warning-600 mt-1">
                  最后修改人: {selectedSub.lastModifiedBy} ·{' '}
                  {formatDate(selectedSub.lastModifiedAt)}
                </p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700">认购资料</h3>
                <button
                  onClick={() => onNavigate('materials', selectedSub.id)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  去处理 →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border ${
                      m.status === 'returned'
                        ? 'border-danger-200 bg-danger-50'
                        : m.status === 'verified'
                        ? 'border-success-200 bg-success-50'
                        : m.status === 'submitted'
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {m.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          materialStatusLabels[m.status]?.color
                        }`}
                      >
                        {materialStatusLabels[m.status]?.label}
                      </span>
                    </div>
                    {m.returnedReason && (
                      <p className="text-xs text-danger-600 mt-2">
                        退回原因: {m.returnedReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => onNavigate('signing', '')}
                className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                查看签约提醒
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">📋</div>
              <p>选择认购单查看详情</p>
            </div>
          </div>
        )}
      </div>

      {showEditModal && selectedSub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              修改认购单
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  房号
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editData.unitNo}
                  onChange={(e) =>
                    setEditData({ ...editData, unitNo: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  总价 (元)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editData.price}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="p-3 bg-warning-50 rounded-lg">
                <p className="text-sm text-warning-600">
                  ⚠️ 修改认购单后，签约提醒会自动标记为"资料已变更"，需重新通知客户。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
