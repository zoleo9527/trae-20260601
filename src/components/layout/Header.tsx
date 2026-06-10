import { BarChart3, Bell, Bike, ChevronDown, Filter, MapPin, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { UserRole } from '../../types';

const roleLabels: Record<UserRole, string> = {
  dispatcher: '运维调度员',
  inspector: '巡检员',
  manager: '区域经理'
};

export const Header = () => {
  const { userRole, setUserRole, complaints, setSearchQuery, searchQuery, activeTab } = useAppStore();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const stats = {
    pending: complaints.filter(c => c.status === 'pending').length,
    processing: complaints.filter(c => c.status === 'assigned' || c.status === 'processing').length,
    completed: complaints.filter(c => c.status === 'completed').length,
    total: complaints.length
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white h-16 flex items-center justify-between px-6 border-b border-slate-700 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Bike className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">共享单车运维平台</h1>
          <p className="text-xs text-slate-400">违规停放 · 城市反馈闭环管理</p>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索工单号、地址、车辆ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-xs text-slate-400">待派单</div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{stats.processing}</div>
            <div className="text-xs text-slate-400">处理中</div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <div className="text-xl font-bold text-orange-400">{stats.completed}</div>
            <div className="text-xs text-slate-400">待关闭</div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <div className="text-xl font-bold text-cyan-400">{stats.total}</div>
            <div className="text-xs text-slate-400">总工单</div>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700" />

        <button className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
          >
            {userRole === 'dispatcher' && <Users className="w-4 h-4 text-cyan-400" />}
            {userRole === 'inspector' && <MapPin className="w-4 h-4 text-green-400" />}
            {userRole === 'manager' && <BarChart3 className="w-4 h-4 text-purple-400" />}
            <span className="text-sm">{roleLabels[userRole]}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          {roleDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setUserRole(role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-slate-700 transition-colors ${
                    userRole === role ? 'bg-slate-700 text-cyan-400' : 'text-white'
                  }`}
                >
                  {role === 'dispatcher' && <Users className="w-4 h-4" />}
                  {role === 'inspector' && <MapPin className="w-4 h-4" />}
                  {role === 'manager' && <BarChart3 className="w-4 h-4" />}
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
