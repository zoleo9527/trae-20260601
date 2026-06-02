import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, User, Package, Clock, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { vehiclesApi, ordersApi, customersApi } from '@/lib/api';
import type { Vehicle, Order, CustomerDetail } from '@/types';

const statusLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待分配', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  in_progress: { label: '施工中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' },
  rework: { label: '需返工', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function VehicleHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const vehicleData = await vehiclesApi.get(parseInt(id));
        setVehicle(vehicleData);

        const customerData = await customersApi.get(vehicleData.customer_id);
        setCustomer(customerData);

        const allOrders = await ordersApi.list();
        const vehicleOrders = allOrders.filter((o) => o.vehicle_id === parseInt(id));
        setOrders(vehicleOrders);
      } catch {
        console.error('加载数据失败');
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-444">加载中...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12 text-gray-444">
        车辆不存在
        <button onClick={() => navigate('/')} className="block mx-auto mt-4 text-blue-500">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">车辆历史记录</h1>
          <p className="text-sm text-gray-444">查看车辆的完整服务历史</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Car size={20} className="text-blue-500" />
              车辆信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-444">车牌号</div>
                <div className="font-bold text-xl text-blue-600">{vehicle.plate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-444">车型</div>
                <div className="font-medium">
                  {vehicle.brand} {vehicle.model}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-444">颜色</div>
                <div>{vehicle.color}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-green-500" />
              历史工单 ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无历史工单</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusConfig = statusLabels[order.status] || statusLabels.pending;
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="p-4 border border-gray-444 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">工单 #{order.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            {order.is_rework ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded flex items-center gap-1">
                                <AlertTriangle size={10} />
                                返工
                              </span>
                            ) : null}
                          </div>
                          <div className="text-sm text-gray-444 mt-1">
                            <Clock size={12} className="inline mr-1" />
                            {order.created_at?.slice(0, 16)}
                            {order.completed_at && ` ~ ${order.completed_at.slice(0, 16)}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">技师</div>
                          <div className="font-medium">{order.employee_name || '-'}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items?.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-444 text-sm rounded"
                          >
                            {item.service_type}
                            {item.package_name && ` (${item.package_name})`}
                          </span>
                        ))}
                      </div>
                      {order.total_amount > 0 && (
                        <div className="mt-3 pt-3 border-t text-right">
                          <span className="text-sm text-gray-400">金额：</span>
                          <span className="font-semibold text-gray-800">¥{order.total_amount}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} className="text-green-500" />
              车主信息
            </h2>
            {customer && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">{customer.name?.[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {customer.name}
                      {customer.level === 'vip' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">VIP</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-444">{customer.phone}</div>
                  </div>
                </div>
                {customer.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-444">
                    备注：{customer.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package size={20} className="text-purple-500" />
              可用套餐
            </h2>
            {customer?.packages?.length === 0 ? (
              <div className="text-center py-4 text-gray-400">暂无可用套餐</div>
            ) : (
              <div className="space-y-3">
                {customer?.packages?.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-3 rounded-lg border ${
                      pkg.isLow ? 'border-amber-300 bg-amber-50' : 'border-gray-444'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{pkg.package_name}</span>
                      <span className="text-xs text-gray-444">
                        {pkg.remaining_count}/{pkg.total_count}次
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          pkg.isLow ? 'bg-amber-500' : 'bg-purple-500'
                        }`}
                        style={{
                          width: `${(pkg.remaining_count / pkg.total_count) * 100}%`,
                        }}
                      />
                    </div>
                    {pkg.isLow && (
                      <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        剩余次数不足
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/create-order')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            新建工单
          </button>
        </div>
      </div>
    </div>
  );
}
