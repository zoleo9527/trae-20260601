import { useState } from 'react';
import { Search, Filter, Calendar, Package, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { statusLabels, differenceTypeLabels, differenceStatusLabels } from '../data/mockData';

export default function StoreFeedbackPage() {
  const { stockRequests, stores } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const requests = stockRequests;

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.store.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = storeFilter === 'all' || request.storeId === Number(storeFilter);
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStore && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    delivering: 'bg-orange-100 text-orange-800',
    delivered: 'bg-purple-100 text-purple-800',
    inspected: 'bg-green-100 text-green-800',
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'delivering':
        return <Clock className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'inspected':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const groupByStore = () => {
    const groups: Record<number, typeof requests> = {};
    filteredRequests.forEach(request => {
      if (!groups[request.storeId]) {
        groups[request.storeId] = [];
      }
      groups[request.storeId].push(request);
    });
    return groups;
  };

  const storeGroups = groupByStore();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">门店反馈</h2>
          <p className="text-gray-500 mt-1">查看各门店的申领记录和处理结果</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品或门店..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="pl-10 pr-6 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
            >
              <option value="all">全部门店</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-6 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
            >
              <option value="all">全部状态</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(storeGroups).map(([storeId, storeRequests]) => {
          const store = stores.find(s => s.id === Number(storeId));
          if (!store) return null;

          const stats = {
            total: storeRequests.length,
            pending: storeRequests.filter(r => r.status === 'pending').length,
            completed: storeRequests.filter(r => r.status === 'inspected').length,
            hasDifferences: storeRequests.some(r => r.differences && r.differences.length > 0),
          };

          return (
            <div key={storeId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{store.name}</h3>
                    <p className="text-sm text-gray-500">{store.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">总申领</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500">处理中</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-xs text-gray-500">已完成</p>
                  </div>
                  {stats.hasDifferences && (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">有差异</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {storeRequests.map(request => (
                  <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">#{String(request.id).padStart(6, '0')}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                            {getStatusIcon(request.status)}
                            {statusLabels[request.status]}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Package className="w-4 h-4 mr-1" />
                            {request.product.name} ({request.product.spec})
                          </span>
                          <span>{request.requestQty} {request.product.unit}</span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {request.expectedDate}
                          </span>
                        </div>
                        {request.reason && (
                          <p className="mt-2 text-sm text-gray-500">原因: {request.reason}</p>
                        )}
                        {request.supervisorComment && (
                          <p className="mt-2 text-sm bg-blue-50 px-3 py-2 rounded-lg text-blue-700">
                            审核意见: {request.supervisorComment}
                          </p>
                        )}
                        {request.differences && request.differences.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {request.differences.map(diff => (
                              <div key={diff.id} className="bg-red-50 px-3 py-2 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-700">
                                    {differenceTypeLabels[diff.type]}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    diff.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                    diff.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {differenceStatusLabels[diff.status]}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-red-600">{diff.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无申领记录</p>
        </div>
      )}
    </div>
  );
}
