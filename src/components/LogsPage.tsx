'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getOperationLogs } from '@/services/dataService';
import type { OperationLog } from '@/types';
import { formatDate } from '@/components/ListItems';
import { roleLabels } from '@/data/mockData';

export default function LogsPage() {
  const { currentUser, refreshTrigger } = useApp();
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, filter]);

  const loadData = async () => {
    setLoading(true);
    let data = await getOperationLogs();

    if (filter !== 'all') {
      data = data.filter((l) => l.type === filter);
    }

    data.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setLogs(data);
    setLoading(false);
  };

  const typeLabels: Record<string, string> = {
    all: '全部类型',
    visit: '来访登记',
    followup: '跟进记录',
    subscription: '认购单',
    material: '认购资料',
    reminder: '签约提醒',
  };

  const typeColors: Record<string, string> = {
    visit: 'bg-blue-100 text-blue-600',
    followup: 'bg-green-100 text-green-600',
    subscription: 'bg-purple-100 text-purple-600',
    material: 'bg-orange-100 text-orange-600',
    reminder: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">操作日志</h3>
          <div className="text-sm text-gray-500">
            共 {logs.length} 条记录
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.keys(typeLabels).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === type
                  ? 'bg-primary-100 text-primary-600 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        typeColors[log.type] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {log.targetType}
                    </span>
                    <span className="font-medium text-gray-800">
                      {log.action}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{log.detail}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>操作人: {log.operatorName}</span>
                  <span>角色: {roleLabels[log.operatorRole]}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p>暂无操作日志</p>
          </div>
        )}
      </div>
    </div>
  );
}
