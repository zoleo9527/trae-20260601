import { useEffect } from 'react';
import { useStore } from '../stores/appStore';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, ClipboardCheck, Warehouse, AlertTriangle, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, sales, fetchSales, inventory, fetchInventory, credits, fetchCredits } = useStore();

  useEffect(() => {
    fetchSales();
    fetchInventory();
    fetchCredits();
  }, []);

  const pendingCount = sales.filter(s => s.status === 'pending_confirmation').length;
  const warehousePendingCount = sales.filter(s => s.status === 'pending_warehouse' || s.status === 'stock_insufficient').length;
  const overdueCount = credits.filter(c => c.status === 'overdue').length;
  const lowStockCount = inventory.filter(i => i.quantity <= i.warning_threshold).length;

  const statCards = {
    owner: [
      { label: '待确认销售单', value: pendingCount, icon: ClipboardCheck, color: 'bg-blue-500', path: '/sales/list' },
      { label: '赊账逾期', value: overdueCount, icon: AlertTriangle, color: 'bg-red-500', path: '/credit' },
      { label: '库存预警', value: lowStockCount, icon: Warehouse, color: 'bg-orange-500', path: '/inventory' },
    ],
    technician: [
      { label: '待确认销售单', value: pendingCount, icon: ClipboardCheck, color: 'bg-blue-500', path: '/confirmation/list' },
      { label: '今日已确认', value: sales.filter(s => s.status === 'pending_warehouse' && new Date(s.updated_at).toDateString() === new Date().toDateString()).length, icon: CheckCircle, color: 'bg-green-500', path: '/confirmation/list' },
    ],
    warehouse: [
      { label: '待出库销售单', value: warehousePendingCount, icon: Warehouse, color: 'bg-purple-500', path: '/warehouse/list' },
      { label: '库存预警', value: lowStockCount, icon: AlertTriangle, color: 'bg-orange-500', path: '/inventory' },
    ],
  };

  const cards = statCards[currentUser?.role] || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          欢迎回来，{currentUser?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.path}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-4"
          >
            <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}>
              <card.icon size={24} />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
            <ArrowRight size={20} className="text-gray-300" />
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      {currentUser?.role === 'owner' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">快捷操作</h2>
          <div className="flex gap-4">
            <Link
              to="/sales/new"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <ShoppingCart size={20} />
              <span className="font-medium">新建销售单</span>
            </Link>
            <Link
              to="/sales/list"
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ClipboardCheck size={20} />
              <span className="font-medium">查看全部订单</span>
            </Link>
          </div>
        </div>
      )}

      {currentUser?.role === 'technician' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">待处理任务</h2>
          {pendingCount > 0 ? (
            <Link
              to="/confirmation/list"
              className="flex items-center gap-2 text-primary hover:text-primary-dark"
            >
              <span>您有 {pendingCount} 个销售单待确认用药提醒</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <p className="text-gray-400">暂无待处理任务</p>
          )}
        </div>
      )}

      {currentUser?.role === 'warehouse' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">待处理任务</h2>
          {warehousePendingCount > 0 ? (
            <Link
              to="/warehouse/list"
              className="flex items-center gap-2 text-primary hover:text-primary-dark"
            >
              <span>您有 {warehousePendingCount} 个销售单待出库</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <p className="text-gray-400">暂无待处理任务</p>
          )}
        </div>
      )}
    </div>
  );
}
