'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getFollowUpRecords, addFollowUpRecord } from '@/services/dataService';
import type { FollowUpRecord } from '@/types';
import { formatDate } from '@/components/ListItems';

interface FollowUpsPageProps {
  selectedId?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待跟进', color: 'bg-warning-100 text-warning-600' },
  completed: { label: '已完成', color: 'bg-success-100 text-success-600' },
  overdue: { label: '已逾期', color: 'bg-danger-100 text-danger-600' },
};

export default function FollowUpsPage({ selectedId }: FollowUpsPageProps) {
  const { currentUser, refreshTrigger, triggerRefresh } = useApp();
  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerName: '',
    followType: '电话',
    content: '',
    nextFollowDate: '',
    status: 'pending' as const,
  });

  useEffect(() => {
    loadData();
  }, [currentUser, refreshTrigger, filter]);

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
    if (!formData.customerName || !formData.content) {
      alert('请填写客户姓名和跟进内容');
      return;
    }

    await addFollowUpRecord(
      {
        customerId: 'c_' + Date.now(),
        customerName: formData.customerName,
        followDate: new Date().toISOString(),
        followType: formData.followType,
        content: formData.content,
        nextFollowDate: formData.nextFollowDate || new Date().toISOString(),
        consultantId: currentUser.id,
        consultantName: currentUser.name,
        status: formData.status,
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setFormData({
      customerName: '',
      followType: '电话',
      content: '',
      nextFollowDate: '',
      status: 'pending',
    });
    setShowAddModal(false);
    triggerRefresh();
  };

  const overdueCount = records.filter((r) => r.status === 'overdue').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200">
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
                  客户姓名 *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                />
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
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
