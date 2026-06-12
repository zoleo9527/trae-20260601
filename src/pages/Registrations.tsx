import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAppStore, roleLabels } from '../lib/store';
import { formatDate } from '../lib/utils';

interface Registration {
  id: string;
  projectId: string;
  projectName: string;
  bidderId: string;
  bidderName: string;
  status: string;
  currentHandlerId?: string;
  currentHandlerRole?: string;
  createdAt: string;
  updatedAt: string;
  currentHandler?: {
    id: string;
    name: string;
    role: string;
  };
  clarifications?: Array<{
    id: string;
    question: string;
    status: string;
  }>;
  operationLogs?: Array<{
    id: string;
    operationType: string;
    operatorName: string;
    createdAt: string;
  }>;
}

export default function Registrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRole, currentUser, selectedRegistrations, setSelectedRegistrations } = useAppStore();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showBatchActions, setShowBatchActions] = useState(false);
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    projectName: searchParams.get('projectName') || '',
    bidderName: searchParams.get('bidderName') || '',
    handlerId: searchParams.get('handlerId') || ''
  });

  useEffect(() => {
    fetchRegistrations();
  }, [page, filters]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '10');
      if (filters.status) params.set('status', filters.status);
      if (filters.projectName) params.set('projectName', filters.projectName);
      if (filters.bidderName) params.set('bidderName', filters.bidderName);
      if (filters.handlerId) params.set('handlerId', filters.handlerId);

      const response = await fetch(`/api/registrations?${params}`);
      const data = await response.json();
      if (data.success) {
        setRegistrations(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const handleSelectRegistration = (id: string) => {
    if (selectedRegistrations.includes(id)) {
      setSelectedRegistrations(selectedRegistrations.filter(i => i !== id));
    } else {
      setSelectedRegistrations([...selectedRegistrations, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRegistrations.length === registrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(registrations.map(r => r.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedRegistrations.length === 0) return;
    
    try {
      const response = await fetch('/api/registrations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationIds: selectedRegistrations,
          operation: 'approve',
          handlerId: currentUser?.id,
          handlerName: currentUser?.name,
          handlerRole: currentRole,
          note: '批量通过'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSelectedRegistrations([]);
        fetchRegistrations();
        alert(`成功处理 ${data.processedCount} 条记录`);
      }
    } catch (error) {
      console.error('Failed to batch approve:', error);
    }
  };

  const handleBatchReject = async () => {
    if (selectedRegistrations.length === 0) return;
    
    const reason = prompt('请输入退回原因:');
    if (!reason) return;
    
    const supplementaryNote = prompt('请输入补充备注（可选）:');
    
    try {
      const response = await fetch('/api/registrations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationIds: selectedRegistrations,
          operation: 'reject',
          handlerId: currentUser?.id,
          handlerName: currentUser?.name,
          handlerRole: currentRole,
          note: '批量退回',
          rejectionReason: reason,
          supplementaryNote: supplementaryNote || ''
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSelectedRegistrations([]);
        fetchRegistrations();
        alert(`成功处理 ${data.processedCount} 条记录`);
      }
    } catch (error) {
      console.error('Failed to batch reject:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索项目名称..."
                  value={filters.projectName}
                  onChange={(e) => handleFilterChange('projectName', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="reviewing">审核中</option>
                <option value="approved">已通过</option>
                <option value="rejected">已退回</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="搜索投标人名称..."
              value={filters.bidderName}
              onChange={(e) => handleFilterChange('bidderName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {selectedRegistrations.length > 0 && (
          <div className="fixed bottom-8 left-64 right-0 bg-blue-600 text-white px-8 py-4 rounded-t-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                已选择 {selectedRegistrations.length} 条记录
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBatchApprove}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  批量通过
                </button>
                <button
                  onClick={handleBatchReject}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  批量退回
                </button>
                <button
                  onClick={() => setSelectedRegistrations([])}
                  className="px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  取消选择
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRegistrations.length === registrations.length && registrations.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  项目名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投标人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前处理人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRegistrations.includes(reg.id)}
                        onChange={() => handleSelectRegistration(reg.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/registrations/${reg.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {reg.projectName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {reg.bidderName}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={reg.status} type="registration" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {reg.currentHandler ? (
                        <div>
                          <span className="font-medium">{reg.currentHandler.name}</span>
                          <span className="text-gray-500 ml-2">
                            ({roleLabels[reg.currentHandler.role as any] || reg.currentHandler.role})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/registrations/${reg.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && total > 10 && (
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
                  disabled={page * 10 >= total}
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