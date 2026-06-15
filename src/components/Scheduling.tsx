import { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, CheckCircle, AlertCircle, Edit2, Trash2, Plus } from 'lucide-react';
import { getOrders, getStaff, getScheduling, createScheduling } from '../api';
import { Order, Staff, Scheduling as SchedulingType, STATUS_COLORS } from '../types';

export default function Scheduling() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [scheduling, setScheduling] = useState<SchedulingType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [ordersData, staffData, schedulingData] = await Promise.all([
      getOrders(),
      getStaff('家政员'),
      getScheduling(),
    ]);
    setOrders(ordersData);
    setStaff(staffData);
    setScheduling(schedulingData);
  };

  const handleCreateScheduling = async () => {
    if (!selectedOrder || !selectedStaff) return;
    
    await createScheduling({
      orderId: selectedOrder.id,
      staffId: selectedStaff,
      scheduleDate: selectedOrder.serviceDate,
      scheduleTime: selectedOrder.serviceTime,
    });
    
    setShowModal(false);
    setSelectedOrder(null);
    setSelectedStaff(null);
    await fetchData();
  };

  const unassignedOrders = orders.filter(order => !scheduling.some(s => s.orderId === order.id));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">服务排班</h2>
          <p className="text-gray-500 mt-1">管理服务排班和人员分配</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">已排班订单</h3>
            <span className="text-sm text-gray-500">{scheduling.length} 条记录</span>
          </div>
          <div className="divide-y divide-gray-100">
            {scheduling.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-800">{item.orderNo}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{item.staffName} ({item.staffRole})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{item.scheduleDate}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.scheduleTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 mt-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-md">{item.serviceAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">待排班订单</h3>
              <span className="text-sm text-gray-500">{unassignedOrders.length} 条</span>
            </div>
            <div className="divide-y divide-gray-100">
              {unassignedOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800 text-sm">{order.orderNo}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{order.serviceType}</p>
                      <p className="text-xs text-gray-400 mt-1">{order.serviceDate} {order.serviceTime}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">可用家政员</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {staff.map((s) => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.staffNo} | {s.status}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${s.status === '在线' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">分配家政员</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <div className="p-6">
              {selectedOrder && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">订单信息</p>
                  <p className="font-medium text-gray-800">{selectedOrder.orderNo}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.serviceType} - {selectedOrder.serviceDate} {selectedOrder.serviceTime}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择家政员</label>
                <select
                  value={selectedStaff || ''}
                  onChange={(e) => setSelectedStaff(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择家政员</option>
                  {staff.filter(s => s.status === '在线').map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.staffNo})</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateScheduling}
                  disabled={!selectedStaff}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认分配
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
