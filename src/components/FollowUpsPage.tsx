'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getFollowUpRecords, addFollowUpRecord, getCustomers } from '@/services/dataService';
import type { FollowUpRecord, Customer } from '@/types';
import { formatDate } from '@/components/ListItems';

interface FollowUpsPageProps {
  selectedId?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待跟进', color: 'bg-warning-100 text-warning-600' },
  completed: { label: '已完成', color: 'bg-success-100 text-success-600' },
  overdue: { label: '已逾期', color: 'bg-danger-100 text-danger-600' },
};

const resultLabels: Record<string, { label: string; color: string; desc: string }> = {
  continue: { label: '继续跟进', color: 'bg-primary-100 text-primary-600', desc: '客户仍在考虑中，需继续跟进' },
  subscribed: { label: '转认购', color: 'bg-success-100 text-success-600', desc: '客户确认认购，自动创建认购单和签约提醒' },
  lost: { label: '客户流失', color: 'bg-gray-100 text-gray-500', desc: '客户已放弃，标记为流失' },
};

export default function FollowUpsPage({ selectedId }: FollowUpsPageProps) {
  const { currentUser, refreshTrigger, triggerRefresh } = useApp();
  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkResult, setLinkResult] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    followType: '电话',
    content: '',
    nextFollowDate: '',
    status: 'pending' as const,
    result: 'continue' as 'continue' | 'subscribed' | 'lost',
  });

  useEffect(() => {
    loadData();
    loadCustomers();
  }, [currentUser, refreshTrigger, filter]);

  const loadCustomers = async () => {
    let data = await getCustomers({});
    if (currentUser.role === 'consultant') {
      data = data.filter((c) => c.consultantId === currentUser.id);
    }
    setCustomers(data);
  };

  const loadData = async () => {
    setLoading(true);
    let data = await getFollowUpRecords(
      currentUser.role === 'consultant' ? currentUser.id : undefined
    );

    if (filter !== 'all') {
      data = data.filter((r) => r.status === filter);
    }

    data.sort((a, b) => {
      const statusOrder = { overdue: 0, pending: 1, completed: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.followDate).getTime() - new Date(a.followDate).getTime();
    });

    setRecords(data);
    setLoading(false);
  };

  const handleAddFollowUp = async () => {
    if (!formData.customerId || !formData.content) {
      alert('请选择客户并填写跟进内容');
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === formData.customerId);
    const customerName = selectedCustomer?.name || formData.customerName;
    const phone = selectedCustomer?.phone || formData.phone;

    const result = await addFollowUpRecord(
      {
        customerId: formData.customerId,
        customerName,
        phone,
        followDate: new Date().toISOString(),
        followType: formData.followType,
        content: formData.content,
        nextFollowDate: formData.nextFollowDate || new Date().toISOString(),
        consultantId: currentUser.id,
        consultantName: currentUser.name,
        status: formData.result === 'subscribed' ? 'completed' : formData.status,
        result: formData.result,
      } as any,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setFormData({
      customerId: '',
      customerName: '',
      phone: '',
      followType: '电话',
      content: '',
      nextFollowDate: '',
      status: 'pending',
      result: 'continue',
    });
    setShowAddModal(false);

    if (formData.result === 'subscribed' && result.handoverId) {
      setLinkResult('已自动创建认购单、签约提醒、交接记录和审核待办');
      setTimeout(() => setLinkResult(null), 5000);
    } else if (formData.result === 'lost') {
      setLinkResult('客户已标记为流失');
      setTimeout(() => setLinkResult(null), 3000);
    }

    triggerRefresh();
  };

  const overdueCount = records.filter((r) => r.status === 'overdue').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {linkResult && (
        <div className="mx-4 mt-4 px-4 py-3 bg-success-50 border border-success-200 rounded-lg text-sm font-medium text-success-700">
          ✓ {linkResult}
        </div>
      )}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-800">跟进管理</h3>
            {overdueCount > 0 && (
              <span className="text-xs px-2 py-1 bg-danger-100 text-danger-600 rounded-full animate-blink">
                {overdueCount} 条逾期
              </span>
            )}
          </div>
          {currentUser.role === 'consultant' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              + 新增跟进
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          {['all', 'overdue', 'pending', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === s
                  ? 'bg-primary-100 text-primary-600 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all'
                ? '全部'
                : statusLabels[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className={`p-4 rounded-lg border transition-all ${
                  record.status === 'overdue'
                    ? 'border-danger-200 bg-danger-50'
                    : record.status === 'pending'
                    ? 'border-warning-200 bg-warning-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {record.customerName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          statusLabels[record.status]?.color
                        }`}
                      >
                        {statusLabels[record.status]?.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {record.followType} · {formatDate(record.followDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">下次跟进</div>
                    <div className="text-sm text-gray-700">
                      {formatDate(record.nextFollowDate)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">{record.content}</p>
                <div className="text-xs text-gray-400 mt-2">
                  跟进顾问: {record.consultantName}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📞</div>
            <p>暂无跟进记录</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              新增跟进记录
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择客户 *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.customerId}
                  onChange={(e) => {
                    const c = customers.find((x) => x.id === e.target.value);
                    setFormData({
                      ...formData,
                      customerId: e.target.value,
                      customerName: c?.name || '',
                      phone: c?.phone || '',
                    });
                  }}
                >
                  <option value="">请选择客户...</option>
                  {customers
                    .filter((c) => c.status !== 'lost')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} —{' '}
                        {statusLabels[c.status]?.label || c.status}
                      </option>
                    ))}
                </select>
                {formData.customerId && (
                  <div className="mt-1.5 text-xs text-gray-500">
                    客户状态:{' '}
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        statusLabels[
                          customers.find((c) => c.id === formData.customerId)
                            ?.status || ''
                        ]?.color
                      }`}
                    >
                      {
                        statusLabels[
                          customers.find((c) => c.id === formData.customerId)
                            ?.status || ''
                        ]?.label
                      }
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  跟进方式
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.followType}
                  onChange={(e) =>
                    setFormData({ ...formData, followType: e.target.value })
                  }
                >
                  <option value="电话">电话</option>
                  <option value="微信">微信</option>
                  <option value="到访">到访</option>
                  <option value="短信">短信</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  跟进内容 *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  跟进结果
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['continue', 'subscribed', 'lost'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, result: r })}
                      className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                        formData.result === r
                          ? `${resultLabels[r].color} border-current font-medium`
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {resultLabels[r].label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {resultLabels[formData.result].desc}
                </p>
              </div>
              {formData.result === 'continue' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    下次跟进日期
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.nextFollowDate}
                    onChange={(e) =>
                      setFormData({ ...formData, nextFollowDate: e.target.value })
                    }
                  />
                </div>
              )}
              {formData.result === 'subscribed' && (
                <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                  <p className="text-sm text-success-700 font-medium">
                    ✓ 跟进转认购
                  </p>
                  <p className="text-xs text-success-600 mt-1">
                    系统将自动创建认购单（草稿）、4份认购资料、签约提醒、交接记录和销控审核待办
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddFollowUp}
                className={`px-4 py-2 text-white rounded-lg text-sm transition-colors ${
                  formData.result === 'subscribed'
                    ? 'bg-success-500 hover:bg-success-600'
                    : 'bg-primary-500 hover:bg-primary-600'
                }`}
              >
                {formData.result === 'subscribed' ? '确认转认购' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
