import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Calendar, MessageSquare, Home, Users, Menu, X, AlertTriangle } from 'lucide-react';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';

const navItems = [
  { path: '/', label: '工作台', icon: Home },
  { path: '/visits', label: '探视预约', icon: Calendar },
  { path: '/communications', label: '家属沟通', icon: MessageSquare },
  { path: '/elders', label: '老人信息', icon: Users },
];

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, getVisitsByCurrentUser, getCommunicationsByCurrentUser } = useStore();

  const stuckVisits = getVisitsByCurrentUser().filter(v => v.status === 'stuck').length;
  const stuckComms = getCommunicationsByCurrentUser().filter(c => c.status === 'stuck' || c.status === 'escalated').length;
  const totalStuck = stuckVisits + stuckComms;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-xl font-bold text-gray-900">养老护理院管理系统</h1>
          </div>
          <div className="flex items-center gap-4">
            {totalStuck > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium animate-pulse">
                <AlertTriangle className="h-4 w-4" />
                {totalStuck} 项待处理异常
              </div>
            )}
            <RoleSwitcher />
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">当前用户：</span>
                <span className="font-medium text-gray-900">{currentUser.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}>
          <nav className="p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.path === '/visits' && stuckVisits > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {stuckVisits}
                    </span>
                  )}
                  {item.path === '/communications' && stuckComms > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {stuckComms}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
