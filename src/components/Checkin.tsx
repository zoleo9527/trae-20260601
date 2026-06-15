import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  MapPin, 
  Calendar,
  RefreshCw,
  CheckSquare,
  Eye,
  AlertCircle
} from 'lucide-react';
import { getCheckin, getScheduling, getOrders, createCheckin } from '../api';
import { Checkin as CheckinType, Scheduling, Order, STATUS_COLORS } from '../types';
import OrderProgressCard from './OrderProgressCard';

export default function Checkin() {
  const [checkins, setCheckins] = useState<CheckinType[]>([]);
  const [scheduling, setScheduling] = useState<Scheduling[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Scheduling | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [remark, setRemark] = useState('准时到达');
  const [notArrivedReason, setNotArrivedReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [checkinData, schedulingData, ordersData] = await Promise.all([
      getCheckin(),
      getScheduling(),
      getOrders(),
    ]);
    setCheckins(checkinData);
    setScheduling(schedulingData);
    setOrders(ordersData);
  };

  const handleCheckin = async () => {
    if (!selectedSchedule) return;
    
    await createCheckin({
      schedulingId: selectedSchedule.id,
      staffId: selectedSchedule.staffId,
      checkinTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: remark.includes('未到岗') || notArrivedReason ? '未到岗' : '已到岗',
      remark: remark,
      notArrivedReason: notArrivedReason,
    });
    
    setShowModal(false);
    setSelectedSchedule(null);
    setRemark('准时到达');
    setNotArrivedReason('');
    await fetchData();
  };

  const pendingCheckins = scheduling.filter(s => 
    s.status === '已排班' && !checkins.some(c => c.schedulingId === s.id)
  );

  const getOrderInfo = (orderId?: number) => {
    return orders.find(o => o.id === orderId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '已到岗':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case '未到岗':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">到岗确认</h2>
          <p className="text-gray-500 mt-1">实时监控家政员到岗状态</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <CheckSquare className="w-4 h-4" />
          <span>新增到岗确认</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">到岗记录</h3>
            <button 
              onClick={fetchData}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {checkins.map((checkin) => {
              const schedule = scheduling.find(s => s.id === checkin.schedulingId);
              const order = getOrderInfo(schedule?.orderId);
              return (
                <div key={checkin.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${checkin.status === '已到岗' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        {getStatusIcon(checkin.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-800">{order?.orderNo}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[checkin.status]}`}>
                            {checkin.status}
                          </span>
                          {checkin.staffStatus === '离线' && (
                            <span className="flex items-center text-yellow-600 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              离线
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{checkin.staffName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{schedule?.scheduleDate} {schedule?.scheduleTime}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 mt-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-md">{order?.serviceAddress}</span>
                        </div>
                        {checkin.notArrivedReason && (
                          <p className="text-xs text-yellow-600 mt-1">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            未到岗原因: {checkin.notArrivedReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">到岗时间</p>
                      <p className="font-medium text-gray-800">{checkin.checkinTime || '-'}</p>
                      <p className="text-xs text-gray-500 mt-1">{checkin.remark}</p>
                      <button
                        onClick={() => setSelectedOrderId(schedule?.orderId || 0)}
                        className="mt-2 p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">待确认到岗</h3>
              <span className="text-sm text-gray-500">{pendingCheckins.length} 条</span>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingCheckins.map((schedule) => {
                const order = getOrderInfo(schedule.orderId);
                return (
                  <div key={schedule.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-800 text-sm">{order?.orderNo}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[schedule.status]}`}>
                            {schedule.status}
                          </span>
                          {schedule.staffStatus === '离线' && (
                            <span className="flex items-center text-yellow-600 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              离线
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{schedule.staffName} - {order?.serviceType}</p>
                        <p className="text-xs text-gray-400 mt-1">{schedule.scheduleDate} {schedule.scheduleTime}</p>
                        {order?.blockReason && (
                          <p className="text-xs text-yellow-600 mt-1">{order.blockReason}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="font-semibold text-lg mb-4">今日统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">{checkins.filter(c => c.status === '已到岗').length}</p>
                <p className="text-blue-100 text-sm mt-1">已到岗</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{pendingCheckins.length}</p>
                <p className="text-blue-100 text-sm mt-1">待确认</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">到岗确认</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <div className="p-6">
              {selectedSchedule && (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">订单信息</p>
                    <p className="font-medium text-gray-800">{getOrderInfo(selectedSchedule.orderId)?.orderNo}</p>
                    <p className="text-sm text-gray-600">{getOrderInfo(selectedSchedule.orderId)?.serviceType}</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedSchedule.scheduleDate} {selectedSchedule.scheduleTime}</p>
                    {getOrderInfo(selectedSchedule.orderId)?.blockReason && (
                      <p className="text-xs text-yellow-600 mt-1">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {getOrderInfo(selectedSchedule.orderId)?.blockReason}
                      </p>
                    )}
                  </div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">服务人员</p>
                    <p className="font-medium text-gray-800">{selectedSchedule.staffName}</p>
                    <p className="text-xs text-gray-400">状态: {selectedSchedule.staffStatus}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">到岗备注</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">未到岗原因（可选）</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      value={notArrivedReason}
                      onChange={(e) => setNotArrivedReason(e.target.value)}
                      placeholder="如家政员未到岗，请填写原因"
                    ></textarea>
                  </div>
                </>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCheckin}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  确认到岗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrderId && (
        <OrderProgressCard
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}