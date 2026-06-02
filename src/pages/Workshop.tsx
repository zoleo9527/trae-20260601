import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Clock, Car, User, AlertTriangle, Play, RefreshCw, CheckCircle } from 'lucide-react';
import { ordersApi, employeesApi } from '@/lib/api';
import type { Order, Employee } from '@/types';

const statusLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待开始', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  in_progress: { label: '施工中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: '待质检', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  rework: { label: '返工中', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function Workshop() {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState<Employee[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<Employee | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employeesApi.technicians().then(setTechnicians);
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await ordersApi.list('today');
      let filtered = allOrders.filter((o) => !o.has_passed_inspection);
      
      if (selectedTechnician) {
        filtered = filtered.filter((o) => o.employee_id === selectedTechnician.id);
      }
      setOrders(filtered);
    } catch {
      console.error('加载数据失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [selectedTechnician]);

  const handleStartWork = async (order: Order) => {
    try {
      await ordersApi.updateStatus(order.id, 'in_progress');
      loadOrders();
    } catch {
      console.error('开始施工失败');
    }
  };

  const handleComplete = async (order: Order) => {
    try {
      await ordersApi.updateStatus(order.id, 'completed');
      loadOrders();
    } catch {
      console.error('完成施工失败');
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress');
  const reworkOrders = orders.filter((o) => o.status === 'rework');
  const completedOrders = orders.filter((o) => o.status === 'completed');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">施工处理</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTechnician(null)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                !selectedTechnician ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-444'
              }`}
            >
              全部
            </button>
            {technicians.map((tech) => (
              <button
                key={tech.id}
                onClick={() => setSelectedTechnician(tech)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  selectedTechnician?.id === tech.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-444 hover:bg-gray-200'
                }`}
              >
                {tech.name}
              </button>
            ))}
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-444">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {[
            { key: 'pending', title: '待开始', orders: pendingOrders, color: 'yellow' },
            { key: 'in_progress', title: '施工中', orders: inProgressOrders, color: 'blue' },
            { key: 'rework', title: '返工中', orders: reworkOrders, color: 'red' },
            { key: 'completed', title: '待质检', orders: completedOrders, color: 'purple' },
          ].map((column) => {
            const statusConfig = statusLabels[column.key];
            return (
              <div key={column.key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className={`font-semibold ${statusConfig.color}`}>
                    {column.title}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-sm ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {column.orders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {column.orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-444 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg text-gray-800">{order.plate}</span>
                        {order.is_rework ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded flex items-center gap-1">
                            <AlertTriangle size={12} />
                            返工
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car size={14} />
                          <span>{order.brand} {order.model}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>{order.created_at?.slice(11, 16)}</span>
                        </div>
                      </div>
                      {order.employee_name && (
                        <div className="mt-2 text-xs text-gray-444">
                          技师：{order.employee_name}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-444 text-xs rounded">
                            {item.service_type}
                          </span>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <span className="px-2 py-0.5 text-gray-444 text-xs">
                            +{order.items.length - 2}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        {column.key === 'pending' && (
                          <button
                            onClick={() => handleStartWork(order)}
                            className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
                          >
                            <Play size={14} />
                            开始
                          </button>
                        )}
                        {column.key === 'in_progress' && (
                          <button
                            onClick={() => handleComplete(order)}
                            className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={14} />
                            完成
                          </button>
                        )}
                        {column.key === 'rework' && (
                          <button
                            onClick={() => handleComplete(order)}
                            className="flex-1 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={14} />
                            返工完成
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/order/${order.id}`)}
                          className="flex-1 py-2 border border-gray-444 text-gray-444 text-sm rounded-lg hover:bg-gray-50"
                        >
                          详情
                        </button>
                      </div>
                    </div>
                  ))}
                  {column.orders.length === 0 && (
                    <div className="text-center py-8 text-gray-300">
                      <Wrench size={32} className="mx-auto mb-2 opacity-50" />
                      暂无工单
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
