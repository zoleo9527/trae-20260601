import { ChevronRight, Clock, FileText, Filter, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLogs, getOrders } from '../api';
import { OperationLog, Order, ROLE_COLORS } from '../types';

export default function Logs() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [logsData, ordersData] = await Promise.all([
      getLogs(),
      getOrders(),
    ]);
    setLogs(logsData);
    setOrders(ordersData);
  };

  const getOrderNo = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    return order?.orderNo || '未知订单';
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operatorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrder = !orderFilter || log.orderId === Number(orderFilter);
    return matchesSearch && matchesOrder;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('创建')) return 'bg-blue-100 text-blue-600';
    if (action.includes('排班')) return 'bg-purple-100 text-purple-600';
    if (action.includes('到岗')) return 'bg-green-100 text-green-600';
    if (action.includes('完成')) return 'bg-gray-100 text-gray-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">操作日志</h2>
          <p className="text-gray-500 mt-1">追踪系统操作记录</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索操作、详情、操作人..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部订单</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>{order.orderNo}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredLogs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionIcon(log.action)}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">{log.action}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-sm text-gray-600">{getOrderNo(log.orderId)}</span>
                    {log.operatorRole && (
                      <span className={`px-2 py-0.5 text-xs rounded ${ROLE_COLORS[log.operatorRole]}`}>
                        {log.operatorRole}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.detail}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{log.operatorName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{log.createdAt}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}