import { useEffect } from 'react';
import { useAppStore } from '../store';
import type { OperationLog } from '../types';
import { History, Search, User, Clock } from 'lucide-react';

export default function HistoryPage() {
  const orders = useAppStore((state) => state.orders);
  const searchTerm = useAppStore((state) => state.searchTerm);
  const filterStatus = useAppStore((state) => state.filterStatus);
  const allLogs = useAppStore((state) => state.allLogs);
  const loadAllLogs = useAppStore((state) => state.loadAllLogs);

  useEffect(() => {
    loadAllLogs();
  }, [loadAllLogs]);

  const filteredLogs = allLogs.filter((log) => {
    const order = orders.find((o) => o.id === log.orderId);
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order?.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || order?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getOrderInfo = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">操作历史</h2>
          <p className="text-sm text-gray-500 mt-1">查看所有订单的操作记录</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => useAppStore.getState().setSearchTerm(e.target.value)}
                placeholder="搜索操作、操作员、客户..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-gray-400">暂无操作记录</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const order = getOrderInfo(log.orderId);
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <History className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{log.action}</div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {log.operator}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(log.timestamp)}
                          </span>
                          {order && (
                            <span>订单: {order.customerName}</span>
                          )}
                        </div>
                        {log.details && (
                          <div className="text-sm text-gray-600 mt-2">{log.details}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {log.orderId.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
