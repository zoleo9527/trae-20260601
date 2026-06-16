import React from 'react';
import { AlertCircle, Clock, Package, Scissors, TrendingUp, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import { ORDER_STATUS_MAP, FABRIC_STATUS_MAP, PATTERN_STATUS_MAP, UserRole } from '../types';
import { formatDate } from '../utils/helpers';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onViewOrder: (orderId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onViewOrder }) => {
  const { orders, fabricReservations, patternTasks, currentUser } = useStore();

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    pattern_in_progress: orders.filter(o => o.status === 'pattern_in_progress').length,
    fitting: orders.filter(o => o.status === 'fitting').length,
  };

  const fabricStats = {
    pending: fabricReservations.filter(f => f.status === 'pending').length,
    supplement: fabricReservations.filter(f => f.status === 'supplement').length,
    rejected: fabricReservations.filter(f => f.status === 'rejected').length,
  };

  const patternStats = {
    pending: patternTasks.filter(t => t.status === 'pending').length,
    rejected: patternTasks.filter(t => t.status === 'rejected').length,
    in_progress: patternTasks.filter(t => t.status === 'in_progress').length,
  };

  const pendingFabricList = fabricReservations.filter(f => f.status === 'pending').slice(0, 5);
  const supplementFabricList = fabricReservations.filter(f => f.status === 'supplement');
  const rejectedFabricList = fabricReservations.filter(f => f.status === 'rejected');
  
  const pendingPatternList = patternTasks.filter(t => t.status === 'pending').slice(0, 5);
  const rejectedPatternList = patternTasks.filter(t => t.status === 'rejected');

  const recentOrders = orders.slice(0, 5);

  const statCards = [
    { label: '总订单', value: orderStats.total, icon: Package, color: 'bg-blue-500' },
    { label: '待量体', value: orderStats.pending, icon: Clock, color: 'bg-gray-500' },
    { label: '打版中', value: orderStats.pattern_in_progress, icon: Scissors, color: 'bg-yellow-500' },
    { label: '试衣中', value: orderStats.fitting, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">订单列表</h3>
            <button 
              onClick={() => onNavigate('fabric-reservation')}
              className="text-blue-600 text-sm hover:text-blue-700 flex items-center"
            >
              查看全部 <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => onViewOrder(order.id)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-800">{order.customer_name}</span>
                      <span className="text-sm text-gray-500">{order.phone}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      订单号: {order.id} | {formatDate(order.order_date)}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                    order.status === 'measured' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'fabric_reserved' ? 'bg-green-100 text-green-700' :
                    order.status === 'pattern_in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'fitting' ? 'bg-purple-100 text-purple-700' :
                    'bg-teal-100 text-teal-700'
                  }`}>
                    {ORDER_STATUS_MAP[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {fabricStats.pending + fabricStats.supplement + fabricStats.rejected > 0 && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                  面料待处理
                </h3>
                <button 
                  onClick={() => onNavigate('fabric-reservation')}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  处理
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {supplementFabricList.length > 0 && (
                  <div className="px-6 py-3">
                    <p className="text-xs text-orange-600 font-medium mb-2">需补料</p>
                    {supplementFabricList.map(item => (
                      <div key={item.id} className="text-sm text-gray-600 py-1">
                        {item.customer_name} - {item.fabric_name}
                      </div>
                    ))}
                  </div>
                )}
                {rejectedFabricList.length > 0 && (
                  <div className="px-6 py-3">
                    <p className="text-xs text-red-600 font-medium mb-2">已退回</p>
                    {rejectedFabricList.map(item => (
                      <div key={item.id} className="text-sm text-gray-600 py-1">
                        {item.customer_name} - {item.fabric_name}
                      </div>
                    ))}
                  </div>
                )}
                {pendingFabricList.length > 0 && (
                  <div className="px-6 py-3">
                    <p className="text-xs text-gray-600 font-medium mb-2">待确认</p>
                    {pendingFabricList.map(item => (
                      <div key={item.id} className="text-sm text-gray-600 py-1">
                        {item.customer_name} - {item.fabric_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {patternStats.pending + patternStats.rejected > 0 && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  打版待处理
                </h3>
                <button 
                  onClick={() => onNavigate('pattern-scheduling')}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  处理
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {rejectedPatternList.length > 0 && (
                  <div className="px-6 py-3">
                    <p className="text-xs text-red-600 font-medium mb-2">已退回</p>
                    {rejectedPatternList.map(item => (
                      <div key={item.id} className="text-sm text-gray-600 py-1">
                        {item.customer_name} - {item.task_name}
                      </div>
                    ))}
                  </div>
                )}
                {pendingPatternList.length > 0 && (
                  <div className="px-6 py-3">
                    <p className="text-xs text-gray-600 font-medium mb-2">待分配</p>
                    {pendingPatternList.map(item => (
                      <div key={item.id} className="text-sm text-gray-600 py-1">
                        {item.customer_name} - {item.task_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;