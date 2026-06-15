import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  CalendarCheck,
  User,
  ArrowRight,
  Eye
} from 'lucide-react';
import { getOrders, getScheduling, getCheckin, getLogs } from '../api';
import { Order, Scheduling, Checkin, OperationLog, STATUS_COLORS, ROLE_COLORS } from '../types';
import OrderProgressCard from './OrderProgressCard';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [scheduling, setScheduling] = useState<Scheduling[]>([]);
  const [checkin, setCheckin] = useState<Checkin[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [ordersData, schedulingData, checkinData, logsData] = await Promise.all([
      getOrders(),
      getScheduling(),
      getCheckin(),
      getLogs(),
    ]);
    setOrders(ordersData);
    setScheduling(schedulingData);
    setCheckin(checkinData);
    setLogs(logsData.slice(0, 5));
  };

  const stats = [
    { 
      label: '待处理订单', 
      value: orders.filter(o => o.status === '待排班').length, 
      icon: Clock, 
      color: 'bg-orange-500',
      trend: '+12%'
    },
    { 
      label: '已排班', 
      value: scheduling.filter(s => s.status === '已排班').length, 
      icon: CalendarCheck, 
      color: 'bg-blue-500',
      trend: '+8%'
    },
    { 
      label: '已到岗', 
      value: checkin.filter(c => c.status === '已到岗').length, 
      icon: CheckCircle, 
      color: 'bg-green-500',
      trend: '+15%'
    },
    { 
      label: '待确认', 
      value: checkin.filter(c => c.status !== '已到岗').length, 
      icon: AlertTriangle, 
      color: 'bg-yellow-500',
      trend: '-5%'
    },
  ];

  const pendingOrders = orders.filter(o => ['待排班', '已排班', '待确认'].includes(o.status));
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">运营总览</h2>
        <p className="text-gray-500 mt-1">实时监控服务排班与到岗确认状态</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                <span className="text-green-600">{stat.trend}</span>
                <span className="text-gray-400 ml-2">较上周</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">待处理事项</h3>
            <span className="text-sm text-gray-500">{pendingOrders.length} 条待处理</span>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingOrders.map((order) => (
              <div 
                key={order.id} 
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="font-semibold text-gray-800">{order.orderNo}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                      {order.currentHandler && (
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${order.currentHandler.status === '在线' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className="text-xs text-gray-500">{order.currentHandler.name}</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${ROLE_COLORS[order.currentHandler.role]}`}>
                            {order.currentHandler.role}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">客户信息</p>
                        <p className="text-sm font-medium text-gray-700">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">下一步动作</p>
                        <p className="text-sm font-medium text-blue-600 flex items-center">
                          <ArrowRight className="w-3 h-3 mr-1" />
                          {order.nextAction}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">阻塞原因</p>
                        {order.blockReason ? (
                          <p className="text-sm font-medium text-yellow-600 truncate">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {order.blockReason}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">暂无</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(order.id);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p>暂无待处理事项</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">最近操作</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLogs.map((log) => (
              <div key={log.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{log.detail}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{log.operatorName}</span>
                  </div>
                  <span className="text-xs text-gray-400">{log.createdAt.substring(11, 16)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedOrderId && (
        <OrderProgressCard
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}