import React from 'react';
import { Package, CheckSquare, Truck, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, User, Bell } from 'lucide-react';
import { useAppStore } from '../store/useStore';

export default function Dashboard() {
  const { orders, qualityInspections, shipments, currentUser, getNotificationsByRole, markNotificationRead } = useAppStore();
  
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const producingOrders = orders.filter(o => o.status === 'producing').length;
  const qualityCheckOrders = orders.filter(o => o.status === 'quality_check').length;
  const packagingOrders = orders.filter(o => o.status === 'packaging').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  
  const failedInspections = qualityInspections.filter(qi => qi.overallResult === 'fail').length;
  const pendingInspections = qualityInspections.filter(qi => qi.overallResult === 'pending').length;
  
  const readyShipments = shipments.filter(s => s.status === 'ready').length;
  const inPackaging = shipments.filter(s => s.status === 'packaging').length;
  
  const roleNotifications = getNotificationsByRole(currentUser.role);
  const recentNotifications = roleNotifications.slice(0, 5);

  const statusColors = {
    pending: 'bg-gray-100 text-gray-600',
    producing: 'bg-yellow-100 text-yellow-600',
    completed: 'bg-blue-100 text-blue-600',
    quality_check: 'bg-purple-100 text-purple-600',
    packaging: 'bg-orange-100 text-orange-600',
    shipped: 'bg-green-100 text-green-600'
  };

  const statusLabels = {
    pending: '待生产',
    producing: '生产中',
    completed: '已完成',
    quality_check: '质检中',
    packaging: '打包中',
    shipped: '已发货'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">总览</h2>
          <p className="text-gray-500 mt-1">欢迎回来，{currentUser.name}。以下是今日工作概览。</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待处理订单</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{pendingOrders + producingOrders}</p>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> 较昨日 -12%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">质检中订单</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{qualityCheckOrders}</p>
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 较昨日 +8%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">打包中订单</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{packagingOrders}</p>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> 较昨日 -5%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">异常提醒</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{failedInspections + pendingInspections}</p>
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {failedInspections}项待处理
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">订单进度</h3>
          <div className="space-y-3">
            {orders.slice(0, 6).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                    {order.orderNo.slice(-3)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{order.productName}</p>
                    <p className="text-sm text-gray-500">{order.customer.name} · {order.quantity}件</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <span className="text-sm text-gray-400">{order.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">最近通知</h3>
          <div className="space-y-3">
            {recentNotifications.length > 0 ? (
              recentNotifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markNotificationRead(notification.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{notification.createdAt}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无通知</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">团队成员</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: '王专员', role: 'project_manager', count: qualityCheckOrders + packagingOrders },
            { name: '李师傅', role: 'producer', count: producingOrders },
            { name: '张工', role: 'installer', count: shippedOrders },
            { name: '陈总', role: 'admin', count: 0 }
          ].map(member => (
            <div key={member.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{member.name}</p>
                <p className="text-xs text-gray-500">
                  {member.role === 'project_manager' && '项目专员'}
                  {member.role === 'producer' && '制作师傅'}
                  {member.role === 'installer' && '安装负责人'}
                  {member.role === 'admin' && '管理员'}
                </p>
              </div>
              <div className="ml-auto">
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                  {member.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}