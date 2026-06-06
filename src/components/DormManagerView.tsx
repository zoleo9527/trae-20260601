import { useState } from 'react';
import { useStore } from '@/store';
import { statusColors, statusLabels, OrderStatus } from '@/types';
import { Dashboard } from './Dashboard';
import { OrderCard } from './OrderCard';
import { OrderDetail } from './OrderDetail';
import { NewOrderForm } from './NewOrderForm';
import { BatchImportModal } from './BatchImportModal';
import { 
  Plus, 
  List, 
  Upload, 
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const orderTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending_confirm', label: '待确认' },
  { key: 'rework', label: '返修相关' },
  { key: 'completed', label: '已完成' },
];

export function DormManagerView({ activeTab, setActiveTab }: ViewProps) {
  const { getOrdersForRole } = useStore();
  const orders = getOrdersForRole('dorm_manager');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.includes(searchQuery) || 
                         order.orderNo.includes(searchQuery) ||
                         order.dormitory.includes(searchQuery) ||
                         order.roomNumber.includes(searchQuery);
    
    let matchesStatus = true;
    if (statusFilter === 'pending_confirm') {
      matchesStatus = order.status === 'completion_submitted' || order.status === 'rework_completion_submitted';
    } else if (statusFilter === 'rework') {
      matchesStatus = order.status.startsWith('rework') || order.reworks.length > 0;
    } else if (statusFilter === 'completed') {
      matchesStatus = order.status === 'completion_confirmed' || order.status === 'rework_completion_confirmed';
    }

    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const tabs = [
    { key: 'dashboard', label: '工作台', icon: List },
    { key: 'orders', label: '工单管理', icon: List },
  ];

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
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <Dashboard role="dorm_manager" onViewOrder={(id) => setSelectedOrderId(id)} />
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">工单管理</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBatchImport(true)}
                className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>批量录入</span>
              </button>
              <button
                onClick={() => setShowNewOrder(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>新建工单</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
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
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  {orderTabs.map(tab => (
                    <option key={tab.key} value={tab.key}>{tab.label}</option>
                  ))}
                </select>
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
                  {tab.key === 'pending_confirm' && (
                    <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {orders.filter(o => o.status === 'completion_submitted' || o.status === 'rework_completion_submitted').length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <List className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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

      {showNewOrder && (
        <NewOrderForm onClose={() => setShowNewOrder(false)} />
      )}

      {showBatchImport && (
        <BatchImportModal onClose={() => setShowBatchImport(false)} />
      )}
    </div>
  );
}
