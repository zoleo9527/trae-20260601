import { useState } from 'react';
import { useStore } from '@/store';
import { Dashboard } from './Dashboard';
import { OrderCard } from './OrderCard';
import { OrderDetail } from './OrderDetail';
import { NewOrderForm } from './NewOrderForm';
import { BatchImportModal } from './BatchImportModal';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  Plus, 
  List, 
  Upload, 
  Search,
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

interface ViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const orderTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending_assign', label: '待分配' },
  { key: 'rework', label: '返修工单' },
  { key: 'completed', label: '已完成' },
];

export function LogisticsSupervisorView({ activeTab, setActiveTab }: ViewProps) {
  const { getOrdersForRole, orders, users } = useStore();
  const supervisorOrders = getOrdersForRole('logistics_supervisor');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedOrder = supervisorOrders.find(o => o.id === selectedOrderId);

  const filteredOrders = supervisorOrders.filter(order => {
    const matchesSearch = order.title.includes(searchQuery) || 
                         order.orderNo.includes(searchQuery) ||
                         order.dormitory.includes(searchQuery) ||
                         order.roomNumber.includes(searchQuery);
    
    let matchesStatus = true;
    if (statusFilter === 'pending_assign') {
      matchesStatus = order.status === 'pending';
    } else if (statusFilter === 'rework') {
      matchesStatus = order.status.startsWith('rework') || order.reworks.length > 0;
    } else if (statusFilter === 'completed') {
      matchesStatus = order.status === 'completion_confirmed' || order.status === 'rework_completion_confirmed';
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
    { key: 'dashboard', label: '工作台', icon: BarChart3 },
    { key: 'orders', label: '工单管理', icon: List },
    { key: 'stats', label: '统计分析', icon: BarChart3 },
  ];

  const pendingAssignCount = orders.filter(o => o.status === 'pending').length;
  const reworkCount = orders.filter(o => o.status.startsWith('rework') || o.reworks.length > 0).length;

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
        <Dashboard role="logistics_supervisor" onViewOrder={(id) => setSelectedOrderId(id)} />
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
                  {tab.key === 'pending_assign' && pendingAssignCount > 0 && (
                    <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {pendingAssignCount}
                    </span>
                  )}
                  {tab.key === 'rework' && reworkCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {reworkCount}
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

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">统计分析</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'completion_confirmed' || o.status === 'rework_completion_confirmed').length}
                  </p>
                  <p className="text-sm text-gray-500">已完工</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{reworkCount}</p>
                  <p className="text-sm text-gray-500">返修工单</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.reduce((sum, o) => sum + o.completions.filter(c => c.confirmRemark).length, 0)}
                  </p>
                  <p className="text-sm text-gray-500">有确认备注</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.length > 0 ? ((reworkCount / orders.length) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-gray-500">整体返修率</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary-500" />
                <span>维修师傅工作量与质量分析</span>
              </h3>
              <div className="space-y-3">
                {users.filter(u => u.role === 'repair_worker').map(worker => {
                  const workerOrders = orders.filter(o => o.assignedTo === worker.id);
                  const completed = workerOrders.filter(o => 
                    o.status === 'completion_confirmed' || o.status === 'rework_completion_confirmed'
                  ).length;
                  const inProgress = workerOrders.filter(o => 
                    o.status === 'in_progress' || o.status === 'rework_in_progress'
                  ).length;
                  const reworkOrders = workerOrders.filter(o => o.reworks.length > 0);
                  const reworkRate = completed > 0 ? ((reworkOrders.length / completed) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={worker.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{worker.name}</span>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="text-gray-500">共 {workerOrders.length} 单</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            parseFloat(reworkRate as string) > 20 ? 'bg-red-100 text-red-700' :
                            parseFloat(reworkRate as string) > 10 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            返修率 {reworkRate}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600">✓ 完成 {completed}</span>
                        <span className="text-yellow-600">⏳ 进行中 {inProgress}</span>
                        <span className="text-red-600">⚠ 返修 {reworkOrders.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>返修追溯详情</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">{reworkCount}</p>
                    <p className="text-sm text-gray-500">返修工单</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">
                      {orders.reduce((sum, o) => sum + o.reworks.length, 0)}
                    </p>
                    <p className="text-sm text-gray-500">返修总次数</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">
                    {orders.reduce((sum, o) => {
                      const reworkCompletions = o.completions.filter(c => c.isRework).length;
                      return sum + reworkCompletions;
                    }, 0)}
                  </p>
                    <p className="text-sm text-gray-500">返修完工</p>
                  </div>
                </div>
                
                {orders.filter(o => o.reworks.length > 0).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">最近返修工单（带责任追溯）：</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {orders.filter(o => o.reworks.length > 0).slice(0, 5).map(order => {
                        const lastRework = order.reworks[order.reworks.length - 1];
                        const originalCompletion = order.completions.find(c => c.id === lastRework?.originalCompletionId);
                        return (
                          <div key={order.id} className="text-sm bg-red-50 rounded-lg p-3 border border-red-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">{order.orderNo}</span>
                              <span className="text-xs text-gray-500">
                                {lastRework && format(new Date(lastRework.requestedAt), 'MM-dd HH:mm', { locale: zhCN })}
                              </span>
                            </div>
                            <p className="text-red-700 mb-1">
                              <span className="font-medium">返修原因：</span>
                              {lastRework?.reason}
                            </p>
                            {originalCompletion?.confirmRemark && (
                              <p className="text-amber-700 text-xs">
                                <span className="font-medium">原确认备注：</span>
                                {originalCompletion.confirmRemark}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
