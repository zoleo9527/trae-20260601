import { useState } from 'react';
import { useStore } from '@/store';
import { Dashboard } from './Dashboard';
import { OrderCard } from './OrderCard';
import { OrderDetail } from './OrderDetail';
import { 
  List, 
  Search,
  Clock,
  Wrench,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface ViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const orderTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'rework', label: '返修' },
];

export function RepairWorkerView({ activeTab, setActiveTab }: ViewProps) {
  const { getOrdersForRole } = useStore();
  const orders = getOrdersForRole('repair_worker');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.includes(searchQuery) || 
                         order.orderNo.includes(searchQuery) ||
                         order.dormitory.includes(searchQuery) ||
                         order.roomNumber.includes(searchQuery);
    
    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = order.status === 'assigned' || order.status === 'rework_requested';
    } else if (statusFilter === 'in_progress') {
      matchesStatus = order.status === 'in_progress' || order.status === 'rework_in_progress';
    } else if (statusFilter === 'completed') {
      matchesStatus = order.status === 'completion_confirmed' || order.status === 'rework_completion_confirmed';
    } else if (statusFilter === 'rework') {
      matchesStatus = order.status.startsWith('rework') || order.reworks.length > 0;
    }

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tabs = [
    { key: 'dashboard', label: '工作台', icon: List },
    { key: 'orders', label: '我的工单', icon: Wrench },
  ];

  const pendingCount = orders.filter(o => o.status === 'assigned' || o.status === 'rework_requested').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.key === 'orders' && pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <Dashboard role="repair_worker" onViewOrder={(id) => setSelectedOrderId(id)} />
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">我的工单</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索工单..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
              {orderTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'pending' && pendingCount > 0 && (
                    <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无工单</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => setSelectedOrderId(order.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
