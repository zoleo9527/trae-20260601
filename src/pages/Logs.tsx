import { useEffect, useState } from 'react';
import { Search, Filter, History } from 'lucide-react';
import Layout from '../components/Layout';
import { formatDate } from '../lib/utils';

interface OperationLog {
  id: string;
  entityType: string;
  entityId: string;
  operationType: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  previousStatus?: string;
  newStatus?: string;
  note?: string;
  createdAt: string;
  operator?: {
    name: string;
    role: string;
  };
}

const operationLabels: Record<string, string> = {
  create: '创建记录',
  update_status: '更新状态',
  reject: '退回',
  approve: '通过',
  assign: '分配',
  clarify: '创建澄清',
  batch_approve: '批量通过',
  batch_reject: '批量退回',
};

export default function Logs() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    entityType: '',
    entityId: '',
    operatorId: '',
    operationType: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '20');
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.entityId) params.set('entityId', filters.entityId);
      if (filters.operatorId) params.set('operatorId', filters.operatorId);
      if (filters.operationType) params.set('operationType', filters.operationType);

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">实体类型</label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                <option value="registration">投标报名</option>
                <option value="clarification">答疑澄清</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">操作类型</label>
              <select
                value={filters.operationType}
                onChange={(e) => handleFilterChange('operationType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                <option value="create">创建</option>
                <option value="update_status">更新状态</option>
                <option value="reject">退回</option>
                <option value="approve">通过</option>
                <option value="batch_approve">批量通过</option>
                <option value="batch_reject">批量退回</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">实体ID</label>
              <input
                type="text"
                placeholder="搜索实体ID..."
                value={filters.entityId}
                onChange={(e) => handleFilterChange('entityId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">操作人ID</label>
              <input
                type="text"
                placeholder="搜索操作人ID..."
                value={filters.operatorId}
                onChange={(e) => handleFilterChange('operatorId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  实体类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态变化
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  备注
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.entityType === 'registration' ? '投标报名' : '答疑澄清'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {operationLabels[log.operationType] || log.operationType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <span className="font-medium">{log.operatorName}</span>
                        <span className="text-gray-500 ml-2">({log.operatorRole})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.previousStatus && log.newStatus ? (
                        <div className="flex items-center gap-2">
                          <span>{log.previousStatus}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium">{log.newStatus}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && total > 20 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                共 {total} 条记录
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">第 {page} 页</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 20 >= total}
                  className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}