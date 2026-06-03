import { useState, useEffect } from 'react';
import { Search, Filter, CalendarDays, AlertTriangle, Bell } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import BanquetCard from '@/components/BanquetCard';
import { StatusBadge } from '@/components/Badges';

export default function Home() {
  const { banquets, fetchBanquets, fetchAlerts, loading, alerts, currentRole } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBanquets();
    fetchAlerts();
  }, [fetchBanquets, fetchAlerts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBanquets({ type: typeFilter, status: statusFilter, search: searchTerm });
  };

  const handleFilterChange = () => {
    fetchBanquets({ type: typeFilter, status: statusFilter, search: searchTerm });
  };

  const isKitchenRole = currentRole === 'kitchen_manager';
  const roleFilteredAlerts = isKitchenRole
    ? alerts.filter(a => a.scope === 'kitchen' || a.scope === 'both')
    : alerts;
  const unreadAlerts = roleFilteredAlerts.filter(a => !a.acknowledged);
  const urgentAlerts = unreadAlerts.filter(a => a.priority === 'urgent' || a.priority === 'high');

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'wedding', label: '婚宴' },
    { value: 'annual', label: '年会' },
    { value: 'birthday', label: '寿宴' },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '待确认' },
    { value: 'confirmed', label: '已确认' },
    { value: 'modified', label: '已变更' },
    { value: 'finalized', label: '已定稿' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-wine-800 via-wine-700 to-wine-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-champagne-500/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-champagne-500/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">会前准备中心</h2>
              <p className="text-champagne-200/90">
                桌型方案管理 · 物资清单协同 · 变更实时追踪
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                <div className="text-2xl font-bold">{banquets.length}</div>
                <div className="text-xs text-champagne-200">宴会订单</div>
              </div>
              <div className={`bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border ${urgentAlerts.length > 0 ? 'border-red-400/50' : 'border-white/20'}`}>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {unreadAlerts.length}
                  {urgentAlerts.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse-slow">
                      {urgentAlerts.length} 紧急
                    </span>
                  )}
                </div>
                <div className="text-xs text-champagne-200">待处理变更</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {urgentAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-2">需要立即处理的变更</h4>
              <div className="space-y-2">
                {urgentAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="flex items-center justify-between bg-white/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-red-500" />
                      <span className="text-sm text-red-700">{alert.banquetName}: {alert.description}</span>
                    </div>
                    <StatusBadge status="modified" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-4 border border-champagne-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索宴会名称、客户、厅房..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-500/50 focus:border-champagne-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); handleFilterChange(); }}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-500/50 bg-white"
              >
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-500/50 bg-white"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-wine-700 to-wine-800 text-white rounded-lg hover:from-wine-800 hover:to-wine-900 transition-all shadow-md hover:shadow-lg font-medium"
            >
              搜索
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-md h-64 animate-pulse">
              <div className="h-20 bg-gray-100 rounded-t-2xl"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : banquets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-champagne-100">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">暂无宴会订单</h3>
          <p className="text-gray-500">调整筛选条件或创建新的宴会订单</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banquets.map((banquet, index) => (
            <BanquetCard key={banquet.id} banquet={banquet} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
