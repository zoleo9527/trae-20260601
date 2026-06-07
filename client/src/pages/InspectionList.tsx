import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Filter, Search, ChevronRight, AlertTriangle, CheckCircle, Clock, RotateCcw, FileText } from 'lucide-react';
import { inspectionAPI } from '../services/api';

const InspectionList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(() => {
    const f = searchParams.get('filter');
    const s = searchParams.get('status');
    return f || s || '';
  });
  const [search, setSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    inspectionAPI.list().then(data => {
      setInspections(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterStatuses = filter ? filter.split(',') : [];

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      PENDING: { label: '待处理', color: 'bg-gray-100 text-gray-800', icon: Clock },
      IN_PROGRESS: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: Clock },
      COMPLETED: { label: '待复核', color: 'bg-purple-100 text-purple-800', icon: FileText },
      RETURNED: { label: '已退回', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      SUPPLEMENTED: { label: '已补录', color: 'bg-amber-100 text-amber-800', icon: RotateCcw },
      REVIEWED: { label: '已复核', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const canCreate = user?.role === 'NETWORK_ADMIN' || user?.role === 'STORE_MANAGER';
  const canReview = user?.role === 'STORE_MANAGER';
  const canSupplement = user?.role === 'NETWORK_ADMIN';

  const filtered = inspections.filter(i => {
    const matchSearch = !search || i.machine?.machineNo?.toLowerCase().includes(search.toLowerCase()) ||
      i.machine?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatuses.length === 0 || filterStatuses.includes(i.status);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索设备编号或名称"
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
            <option value="PENDING">待处理</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">待复核</option>
            <option value="RETURNED">已退回</option>
            <option value="SUPPLEMENTED">已补录</option>
            <option value="REVIEWED">已复核</option>
          </select>
        </div>
        {canCreate && (
          <button onClick={() => navigate('/inspections/new')} className="btn btn-primary">
            <Plus size={18} className="mr-1.5" /> 新建巡检
          </button>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'RETURNED', 'SUPPLEMENTED', 'REVIEWED'].map(status => {
          const config = getStatusConfig(status);
          const count = inspections.filter(i => i.status === status).length;
          const Icon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? '' : status)}
              className={`p-3 rounded-lg border transition-colors ${
                filter === status ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={config.color.replace('bg-', 'text-').split(' ')[1]} />
                <span className="text-sm text-gray-600">{config.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
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
            <FileText size={48} className="mx-auto mb-3 text-gray-300" />
            <p>暂无巡检记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">设备</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">巡检人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">是否有问题</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">关联工单</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const statusConfig = getStatusConfig(item.status);
                  const StatusIcon = statusConfig.icon;
                  const showSupplementBtn = item.status === 'RETURNED' && canSupplement;
                  const showReviewBtn = ['COMPLETED', 'SUPPLEMENTED'].includes(item.status) && canReview;
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">{item.machine?.machineNo}</p>
                          <p className="text-sm text-gray-500">{item.machine?.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.inspector?.name}</td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${statusConfig.color}`}>
                          <StatusIcon size={12} className="mr-1" /> {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.hasIssue ? (
                          <span className="text-red-600 text-sm font-medium">有问题</span>
                        ) : (
                          <span className="text-green-600 text-sm font-medium">正常</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.repairOrders?.length > 0 ? `${item.repairOrders.length} 个` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/inspections/${item.id}`)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                          >
                            详情 <ChevronRight size={14} />
                          </button>
                          {showSupplementBtn && (
                            <button
                              onClick={() => navigate(`/inspections/${item.id}`)}
                              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                            >
                              补录
                            </button>
                          )}
                          {showReviewBtn && (
                            <button
                              onClick={() => navigate(`/inspections/${item.id}`)}
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                              复核
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

export default InspectionList;
