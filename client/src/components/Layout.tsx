import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, Wrench, Monitor, Bell, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { notificationAPI } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      notificationAPI.list({ userId: user.id, read: false })
        .then(data => setUnreadCount(data.length))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const navItems = [
    { path: '/', label: '工作台', icon: LayoutDashboard },
    { path: '/inspections', label: '机器巡检', icon: ClipboardCheck },
    { path: '/repairs', label: '维修派单', icon: Wrench },
    { path: '/machines', label: '设备管理', icon: Monitor },
    { path: '/notifications', label: '通知中心', icon: Bell, badge: unreadCount }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            {sidebarOpen && <span className="text-lg font-bold">网咖管理系统</span>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                  {sidebarOpen && item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">
              {navItems.find(n => n.path === location.pathname)?.label || '工作台'}
            </h1>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                  {user?.name?.charAt(0)}
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
                <ChevronDown size={16} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">
                      {user?.role === 'NETWORK_ADMIN' && '网管'}
                      {user?.role === 'EVENT_OPERATOR' && '赛事运营'}
                      {user?.role === 'STORE_MANAGER' && '店长'}
                      {user?.role === 'TECHNICIAN' && '技师'}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <LogOut size={16} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
