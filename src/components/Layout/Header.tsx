import { Bell, Search, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function Header() {
  const location = useLocation();
  const { currentUser } = useAuthStore();

  const showCreateButton = location.pathname === '/';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {location.pathname === '/' && '工作台'}
          {location.pathname === '/parts' && '配件管理'}
          {location.pathname === '/signoff' && '签认中心'}
          {location.pathname === '/equipment' && '设备档案'}
          {location.pathname.startsWith('/workorder/') && (
            location.pathname.includes('create') ? '创建工单' : '工单详情'
          )}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {showCreateButton && (
          <Link
            to="/workorder/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={18} />
            <span>创建工单</span>
          </Link>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>

        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
