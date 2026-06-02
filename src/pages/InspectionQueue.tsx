import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Clock, User, Car, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { ordersApi, inspectionsApi } from '@/lib/api';
import type { Order } from '@/types';

export default function InspectionQueue() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const pendingData = (await inspectionsApi.list('pending')) as unknown as Order[];
        setPendingOrders(pendingData);
      } else {
        const completedData = (await inspectionsApi.list('completed')) as unknown as any[];
        setCompletedOrders(completedData);
      }
    } catch {
      console.error('加载数据失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">质检交车</h1>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-444 hover:bg-gray-200'
          }`}
        >
          待质检 ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-444 hover:bg-gray-200'
          }`}
        >
          已交车 ({completedOrders.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-444">加载中...</div>
        </div>
      ) : activeTab === 'pending' ? (
        pendingOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardCheck size={48} className="mx-auto mb-4 opacity-50" />
            暂无待质检工单
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-444 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">{order.plate}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-gray-800">{order.plate}</span>
                        {order.is_rework ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded flex items-center gap-1">
                            <AlertTriangle size={12} />
                            返工
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-444">
                        <div className="flex items-center gap-1">
                          <Car size={14} />
                          {order.brand} {order.model}
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {order.customer_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {order.created_at?.slice(0, 16)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {order.items?.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-444 text-sm rounded"
                          >
                            {item.service_type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">施工技师</div>
                    <div className="font-medium text-gray-800">
                      {order.employee_name || '未分配'}
                    </div>
                    <div className="mt-4 text-blue-600 text-sm">点击处理 →</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : completedOrders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
          暂无已交车记录
        </div>
      ) : (
        <div className="space-y-4">
          {completedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/order/${order.id}`)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-444 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle size={28} className="text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-gray-800">{order.plate}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded flex items-center gap-1">
                        <CheckCircle size={12} />
                        已交车
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-444">
                      <div className="flex items-center gap-1">
                        <Car size={14} />
                        {order.brand} {order.model}
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        {order.customer_name}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.items?.map((item: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-444 text-sm rounded"
                        >
                          {item.service_type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">质检时间</div>
                  <div className="font-medium text-gray-800">
                    {order.inspected_at?.slice(0, 16)}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    质检员：{order.inspector_name}
                  </div>
                  <div className="mt-4 text-blue-600 text-sm">查看详情 →</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
