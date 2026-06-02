
import { useEffect, useState } from 'react';
import { Search, Clock, User, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { WorkOrder } from '../../shared/types';
import { useAuthStore } from '../store/authStore';

export function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const params: { status?: string; maintenanceId?: string } = {};
        if (statusFilter) params.status = statusFilter;
        if (user?.role === 'maintenance') params.maintenanceId = user.id;
        
        const data = await api.workOrders.list(params);
        setWorkOrders(data);
      } catch (error) {
        console.error('Failed to fetch work orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, [statusFilter, user]);

  const filteredWorkOrders = workOrders.filter(
    (wo) =>
      wo.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.deviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.workOrders.updateStatus(id, status);
      setWorkOrders((prev) =>
        prev.map((wo) => (wo.id === id ? { ...wo, status: status as WorkOrder['status'] } : wo))
      );
    } catch (error) {
      console.error('Failed to update work order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索站点或设备..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态：</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              <option value="pending">待接单</option>
              <option value="accepted">已接单</option>
              <option value="arrived">已到达</option>
              <option value="processing">维修中</option>
              <option value="completed">已完成</option>
              <option value="timeout">已超时</option>
            </select>
          </div>
        </div>
      </div>

      {/* 工单列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkOrders.map((workOrder) => (
          <div key={workOrder.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{workOrder.deviceName}</h3>
                <p className="text-sm text-gray-500">{workOrder.stationName}</p>
              </div>
              <StatusBadge type="workOrder" status={workOrder.status} />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                {workOrder.maintenanceName}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                派单时间：{new Date(workOrder.assignedAt).toLocaleString('zh-CN')}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                预计时长：{workOrder.expectedDuration}分钟
              </div>
            </div>

            {user?.role === 'maintenance' && workOrder.status !== 'completed' && (
              <div className="flex gap-2 pt-4 border-t">
                {workOrder.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(workOrder.id, 'accepted')}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    接单
                  </button>
                )}
                {workOrder.status === 'accepted' && (
                  <button
                    onClick={() => updateStatus(workOrder.id, 'arrived')}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
                  >
                    已到达
                  </button>
                )}
                {(workOrder.status === 'arrived' || workOrder.status === 'processing') && (
                  <button
                    onClick={() => updateStatus(workOrder.id, 'completed')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    完成维修
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
