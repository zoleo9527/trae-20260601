'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getCustomers, addVisitRecord, getVisitRecords } from '@/services/dataService';
import type { Customer, VisitRecord, FilterOptions } from '@/types';
import { formatDate } from '@/components/ListItems';

interface VisitsPageProps {
  selectedId?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待跟进', color: 'bg-gray-100 text-gray-600' },
  following: { label: '跟进中', color: 'bg-primary-100 text-primary-600' },
  subscribed: { label: '已认购', color: 'bg-success-100 text-success-600' },
  lost: { label: '已流失', color: 'bg-gray-100 text-gray-400' },
};

const intentionLabels: Record<string, { label: string; color: string }> = {
  high: { label: '高意向', color: 'bg-success-100 text-success-600' },
  medium: { label: '中意向', color: 'bg-warning-100 text-warning-600' },
  low: { label: '低意向', color: 'bg-gray-100 text-gray-600' },
};

export default function VisitsPage({ selectedId }: VisitsPageProps) {
  const { currentUser, refreshTrigger, triggerRefresh } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<FilterOptions>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkResult, setLinkResult] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    source: '自然来访',
    purpose: '',
    intentionLevel: 'medium' as 'high' | 'medium' | 'low',
    remark: '',
  });

  useEffect(() => {
    loadData();
  }, [currentUser, refreshTrigger, filter]);

  useEffect(() => {
    if (selectedCustomer) {
      getVisitRecords(selectedCustomer.id).then(setVisitRecords);
    }
  }, [selectedCustomer, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    const data = await getCustomers(filter);
    setCustomers(data);
    setLoading(false);
  };

  const handleAddVisit = async () => {
    if (!formData.customerName || !formData.phone) {
      alert('请填写客户姓名和电话');
      return;
    }

    const result = await addVisitRecord(
      {
        customerId: 'new_' + Date.now(),
        customerName: formData.customerName,
        visitDate: new Date().toISOString(),
        purpose: formData.purpose || '首次到访',
        intentionLevel: formData.intentionLevel,
        consultantId: currentUser.id,
        consultantName: currentUser.name,
        remark: formData.remark,
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setFormData({
      customerName: '',
      phone: '',
      source: '自然来访',
      purpose: '',
      intentionLevel: 'medium',
      remark: '',
    });
    setShowAddModal(false);
    setLinkResult(`已同步创建客户档案、交接记录和首次跟进待办`);
    setTimeout(() => setLinkResult(null), 5000);
    triggerRefresh();
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-64px)]">
      {linkResult && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-success-500 text-white rounded-lg shadow-lg text-sm font-medium animate-slide-down">
          ✓ {linkResult}
        </div>
      )}
      <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">客户列表</h3>
            {currentUser.role === 'consultant' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                + 来访登记
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="搜索客户姓名/电话..."
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
              <option value="pending">待跟进</option>
              <option value="following">跟进中</option>
              <option value="subscribed">已认购</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : customers.length > 0 ? (
            customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-all ${
                  selectedCustomer?.id === customer.id
                    ? 'bg-primary-50 border border-primary-200'
                    : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {customer.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      statusLabels[customer.status]?.color
                    }`}
                  >
                    {statusLabels[customer.status]?.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {customer.phone} · {customer.source}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  顾问: {customer.consultantName}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">👥</div>
              <div>暂无客户</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5 overflow-y-auto scrollbar-thin">
        {selectedCustomer ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedCustomer.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCustomer.phone} · {selectedCustomer.source}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  statusLabels[selectedCustomer.status]?.color
                }`}
              >
                {statusLabels[selectedCustomer.status]?.label}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-medium text-gray-700 mb-3">来访记录</h3>
              {visitRecords.length > 0 ? (
                <div className="space-y-3">
                  {visitRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {record.purpose}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            intentionLabels[record.intentionLevel]?.color
                          }`}
                        >
                          {intentionLabels[record.intentionLevel]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{record.remark}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(record.visitDate)} · {record.consultantName}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂未来访记录
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">👤</div>
              <p>选择客户查看详情</p>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              来访登记
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
                  联系电话 *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  来访目的
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  意向程度
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.intentionLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intentionLevel: e.target.value as any,
                    })
                  }
                >
                  <option value="high">高意向</option>
                  <option value="medium">中意向</option>
                  <option value="low">低意向</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  value={formData.remark}
                  onChange={(e) =>
                    setFormData({ ...formData, remark: e.target.value })
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
                onClick={handleAddVisit}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                登记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
