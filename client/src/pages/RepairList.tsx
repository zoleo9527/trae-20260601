import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Wrench, Clock, CheckCircle, AlertTriangle, User, ChevronRight } from 'lucide-react';
import { repairAPI } from '../services/api';

const RepairList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params: any = {};
    if (filter) params.status = filter;
    if (searchParams.get('assignedToId')) params.assignedToId = searchParams.get('assignedToId');
    repairAPI.list(params).then(data => {
      setRepairs(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [filter, searchParams]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
      PENDING_APPROVAL: { label: '待审批', color: 'bg-purple-100 text-purple-800' },
      APPROVED: { label: '已批准', color: 'bg-blue-100 text-blue-800' },
      ASSIGNED: { label: '已指派', color: 'bg-amber-100 text-amber-800' },
      IN_PROGRESS: { label: '维修中', color: 'bg-orange-100 text-orange-800' },
      COMPLETED: { label: '待复核', color: 'bg-cyan-100 text-cyan-800' },
      REVIEWED: { label: '已完成', color: 'bg-green-100 text-green-800' },
      RETURNED: { label: '已退回', color: 'bg-red-100 text-red-800' },
      REOPENED: { label: '已重开', color: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-500' }
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      LOW: { label: '低', color: 'bg-gray-100 text-gray-700' },
      MEDIUM: { label: '中', color: 'bg-blue-100 text-blue-700' },
      HIGH: { label: '高', color: 'bg-orange-100 text-orange-700' },
      CRITICAL: { label: '紧急', color: 'bg-red-100 text-red-700' }
    };
    return configs[priority] || { label: priority, color: 'bg-gray-100 text-gray-700' };
  };

  const canCreate = user?.role !== 'TECHNICIAN';
  const canApprove = user?.role === 'STORE_MANAGER';
  const canAssign = user?.role === 'STORE_MANAGER';

  const filtered = repairs.filter(r =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.machine?.machineNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索工单或设备"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="input w-40"
          >
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="PENDING_APPROVAL">待审批</option>
            <option value="APPROVED">已批准</option>
            <option value="ASSIGNED">已指派</option>
            <option value="IN_PROGRESS">维修中</option>
            <option value="COMPLETED">待复核</option>
            <option value="REVIEWED">已完成</option>
            <option value="RETURNED">已退回</option>
          </select>
        </div>
        {canCreate && (
          <button onClick={() => navigate('/repairs/new')} className="btn btn-primary">
            <Plus size={18} className="mr-1.5" /> 新建工单
          </button>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
        {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'RETURNED'].map(status => {
          const config = getStatusConfig(status);
          const count = repairs.filter(r => r.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? '' : status)}
              className={`p-3 rounded-lg border transition-colors text-center ${
                filter === status ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-xs text-gray-500 truncate">{config.label}</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{count}</p>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Wrench size={48} className="mx-auto mb-3 text-gray-300" />
            <p>暂无维修工单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">工单</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">设备</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">负责人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">优先级</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const statusConfig = getStatusConfig(item.status);
                  const priorityConfig = getPriorityConfig(item.priority);
                  const showApprove = item.status === 'PENDING_APPROVAL' && canApprove;
                  const showAssign = item.status === 'APPROVED' && canAssign;
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{item.description}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{item.machine?.machineNo}</p>
                        <p className="text-xs text-gray-500">{item.machine?.name}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.creator?.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.assignedTo?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${priorityConfig.color}`}>{priorityConfig.label}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${statusConfig.color}`}>{statusConfig.label}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/repairs/${item.id}`)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                          >
                            详情 <ChevronRight size={14} />
                          </button>
                          {showApprove && (
                            <button
                              onClick={() => navigate(`/repairs/${item.id}`)}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              审批
                            </button>
                          )}
                          {showAssign && (
                            <button
                              onClick={() => navigate(`/repairs/${item.id}`)}
                              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                            >
                              指派
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairList;
