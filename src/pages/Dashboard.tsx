import { Package, Truck, ClipboardCheck, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { statusLabels } from '../data/mockData';

export default function Dashboard() {
  const { getAllRequestsWithDetails, differences } = useAppStore();
  const requests = getAllRequestsWithDetails();
  
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    delivering: requests.filter(r => r.status === 'delivering' || r.status === 'delivered').length,
    differences: differences.filter(d => d.status !== 'resolved').length,
  };

  const recentRequests = requests.slice(0, 5);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    delivering: 'bg-orange-100 text-orange-800',
    delivered: 'bg-purple-100 text-purple-800',
    inspected: 'bg-green-100 text-green-800',
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">数据概览</h2>
        <p className="text-gray-500 mt-1">查看门店缺货申领与验收的实时数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">总申领单</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待审核</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">配货中</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.delivering}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待处理差异</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.differences}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <ClipboardCheck className="w-5 h-5 mr-2 text-primary-600" />
              最近申领记录
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRequests.map(request => (
              <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{request.product.name}</p>
                    <p className="text-sm text-gray-500">{request.store.name} · {request.requestQty}{request.product.unit}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                    {statusLabels[request.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
              按状态分布
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(statusLabels).map(([status, label]) => {
                const count = requests.filter(r => r.status === status).length;
                const percentage = requests.length > 0 ? (count / requests.length) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-900">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${statusColors[status].split(' ')[0]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
