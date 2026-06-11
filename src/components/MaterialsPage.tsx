'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  getSubscriptions,
  getSubscriptionMaterials,
  updateSubscriptionMaterial,
} from '@/services/dataService';
import type {
  Subscription,
  SubscriptionMaterial,
} from '@/types';
import { formatDate, getDaysLeft } from '@/components/ListItems';

interface MaterialsPageProps {
  selectedId?: string;
}

const materialStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '未提交', color: 'bg-gray-100 text-gray-500' },
  submitted: { label: '待审核', color: 'bg-primary-100 text-primary-600' },
  verified: { label: '已通过', color: 'bg-success-100 text-success-600' },
  returned: { label: '被退回', color: 'bg-danger-100 text-danger-600' },
};

export default function MaterialsPage({ selectedId }: MaterialsPageProps) {
  const { currentUser, refreshTrigger, triggerRefresh } = useApp();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [materials, setMaterials] = useState<SubscriptionMaterial[]>([]);
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser, refreshTrigger, keyword, materialFilter]);

  useEffect(() => {
    if (selectedId) {
      const match = subscriptions.find((s) => s.id === selectedId);
      if (match && match.id !== selectedSub?.id) {
        setSelectedSub(match);
      }
    }
  }, [selectedId, subscriptions]);

  useEffect(() => {
    if (selectedSub) {
      loadMaterials(selectedSub.id);
    }
  }, [selectedSub, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    let data = await getSubscriptions({ keyword: keyword || undefined });

    if (currentUser.role === 'consultant') {
      data = data.filter((s) => s.consultantId === currentUser.id);
    } else if (currentUser.role === 'controller') {
      data = data.filter((s) => s.controllerId === currentUser.id);
    }

    if (materialFilter && materialFilter !== 'all') {
      data = data.filter((s) => s.materialStatus === materialFilter);
    }

    setSubscriptions(data);
    if (data.length > 0) {
      if (!selectedSub || !data.find((s) => s.id === selectedSub.id)) {
        setSelectedSub(data[0]);
      }
    } else {
      setSelectedSub(null);
    }
    setLoading(false);
  };

  const loadMaterials = async (subId: string) => {
    const data = await getSubscriptionMaterials(subId);
    setMaterials(data);
  };

  const refreshAfterAction = async () => {
    await loadData();
    if (selectedSub) {
      await loadMaterials(selectedSub.id);
    }
  };

  const handleSubmitMaterial = async (materialId: string) => {
    await updateSubscriptionMaterial(
      materialId,
      { status: 'submitted', submittedAt: new Date().toISOString() },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    await refreshAfterAction();
  };

  const handleVerifyMaterial = async (materialId: string) => {
    await updateSubscriptionMaterial(
      materialId,
      { status: 'verified', verifiedAt: new Date().toISOString() },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    await refreshAfterAction();
  };

  const handleReturnMaterial = async (materialId: string) => {
    if (!returnReason.trim()) {
      alert('请填写退回原因');
      return;
    }

    await updateSubscriptionMaterial(
      materialId,
      { status: 'returned', returnedReason: returnReason },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setShowReturnModal(null);
    setReturnReason('');
    await refreshAfterAction();
  };

  const canSubmit = currentUser.role === 'consultant' || currentUser.role === 'manager';
  const canVerify = currentUser.role === 'controller' || currentUser.role === 'manager';

  const returnedCount = materials.filter((m) => m.status === 'returned').length;
  const pendingCount = materials.filter((m) => m.status === 'pending').length;
  const allVerified = materials.length > 0 && materials.every((m) => m.status === 'verified');

  return (
    <div className="flex gap-4 h-[calc(100vh-64px)]">
      <div className="w-96 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">认购单列表</h3>
          <input
            type="text"
            placeholder="搜索客户/房号..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <select
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600"
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
            >
              <option value="all">全部资料状态</option>
              <option value="incomplete">资料不全</option>
              <option value="submitted">待审核</option>
              <option value="verified">已通过</option>
              <option value="returned">被退回</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : subscriptions.length > 0 ? (
            subscriptions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-all border ${
                  selectedSub?.id === sub.id
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      {sub.customerName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {sub.unitNo}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      materialStatusLabels[sub.materialStatus]?.color ||
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {materialStatusLabels[sub.materialStatus]?.label ||
                      sub.materialStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {sub.subscriptionNo}
                  </span>
                  <span
                    className={`text-xs ${
                      getDaysLeft(sub.signDeadline).color
                    }`}
                  >
                    {getDaysLeft(sub.signDeadline).label}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">📁</div>
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
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedSub.customerName} - 认购资料
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSub.subscriptionNo} · {selectedSub.unitNo}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getDaysLeft(selectedSub.signDeadline).color}`}>
                  {getDaysLeft(selectedSub.signDeadline).label}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  签约截止
                </div>
              </div>
            </div>

            {returnedCount > 0 && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-danger-500">⚠️</span>
                  <span className="font-medium text-danger-700">
                    有 {returnedCount} 份资料被退回，需要客户补充
                  </span>
                </div>
                <p className="text-sm text-danger-600 mt-1">
                  请尽快通知客户重新提交，以免影响签约进度
                </p>
              </div>
            )}

            {allVerified && (
              <div className="p-4 bg-success-50 border border-success-200 rounded-lg mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-success-500">✅</span>
                  <span className="font-medium text-success-700">
                    所有资料已审核通过，可以签约
                  </span>
                </div>
              </div>
            )}

            {pendingCount > 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">📋</span>
                  <span className="font-medium text-gray-700">
                    还有 {pendingCount} 份资料未提交
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className={`p-4 rounded-lg border transition-all ${
                    material.status === 'returned'
                      ? 'border-danger-200 bg-danger-50'
                      : material.status === 'verified'
                      ? 'border-success-200 bg-success-50'
                      : material.status === 'submitted'
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📄</span>
                        <div>
                          <div className="font-medium text-gray-800">
                            {material.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {material.type}
                          </div>
                        </div>
                      </div>
                      {material.returnedReason && (
                        <div className="mt-3 ml-9 p-2 bg-white rounded border border-danger-200">
                          <div className="text-xs text-danger-600 font-medium">
                            退回原因:
                          </div>
                          <div className="text-sm text-danger-700 mt-1">
                            {material.returnedReason}
                          </div>
                        </div>
                      )}
                      {material.remark && !material.returnedReason && (
                        <div className="text-sm text-gray-600 mt-2 ml-9">
                          备注: {material.remark}
                        </div>
                      )}
                      {material.submittedAt && (
                        <div className="text-xs text-gray-400 mt-2 ml-9">
                          提交时间: {formatDate(material.submittedAt)}
                        </div>
                      )}
                      {material.verifiedAt && (
                        <div className="text-xs text-gray-400 mt-1 ml-9">
                          审核时间: {formatDate(material.verifiedAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          materialStatusLabels[material.status]?.color
                        }`}
                      >
                        {materialStatusLabels[material.status]?.label}
                      </span>
                      <div className="flex gap-2">
                        {canSubmit && material.status === 'pending' && (
                          <button
                            onClick={() => handleSubmitMaterial(material.id)}
                            className="text-xs px-3 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                          >
                            提交
                          </button>
                        )}
                        {canVerify && material.status === 'submitted' && (
                          <>
                            <button
                              onClick={() =>
                                handleVerifyMaterial(material.id)
                              }
                              className="text-xs px-3 py-1.5 bg-success-500 text-white rounded hover:bg-success-600 transition-colors"
                            >
                              通过
                            </button>
                            <button
                              onClick={() =>
                                setShowReturnModal(material.id)
                              }
                              className="text-xs px-3 py-1.5 bg-danger-500 text-white rounded hover:bg-danger-600 transition-colors"
                            >
                              退回
                            </button>
                          </>
                        )}
                        {canSubmit && material.status === 'returned' && (
                          <button
                            onClick={() => handleSubmitMaterial(material.id)}
                            className="text-xs px-3 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                          >
                            重新提交
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">💡</span>
                <div>
                  <div className="font-medium text-blue-700">
                    资料变更会自动联动签约提醒
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    当认购资料状态变更（通过/退回）时，签约提醒会自动更新状态，
                    并标记为"资料已变更"，确保相关责任人能及时感知。
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">📁</div>
              <p>选择认购单查看资料</p>
            </div>
          </div>
        )}
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              退回资料
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                退回原因 *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-danger-500"
                rows={4}
                placeholder="请详细说明退回原因，方便客户补充..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>
            <div className="p-3 bg-warning-50 rounded-lg mt-4">
              <p className="text-sm text-warning-600">
                ⚠️ 退回资料后，签约提醒会自动标记为"资料已变更"，
                置业顾问会收到通知。
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReturnModal(null);
                  setReturnReason('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleReturnMaterial(showReturnModal)}
                className="px-4 py-2 bg-danger-500 text-white rounded-lg text-sm hover:bg-danger-600 transition-colors"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
