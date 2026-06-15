import React from 'react';
import { LayoutDashboard, CheckSquare, Package, Bell, User, Wifi, WifiOff, Menu, X } from 'lucide-react';
import { useAppStore } from '../store/useStore';

interface LayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: '总览', icon: LayoutDashboard },
  { id: 'quality', label: '成品质检', icon: CheckSquare },
  { id: 'packaging', label: '打包出库', icon: Package },
];

export function Layout({ children, activeMenu, onMenuChange }: LayoutProps) {
  const { currentUser, notifications, offlineMode, toggleOfflineMode, getNotificationsByRole } = useAppStore();
  const roleNotifications = getNotificationsByRole(currentUser.role);
  const unreadCount = roleNotifications.filter(n => !n.read).length;
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">标识制作厂管理系统</h1>
          <span className={`px-2 py-1 text-xs rounded-full ${offlineMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {offlineMode ? '离线模式' : '在线'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleOfflineMode}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={offlineMode ? '切换在线模式' : '切换离线模式'}
          >
            {offlineMode ? <WifiOff className="w-5 h-5 text-red-500" /> : <Wifi className="w-5 h-5 text-green-500" />}
          </button>
          
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-800">{currentUser.name}</div>
              <div className="text-gray-500 text-xs">
                {currentUser.role === 'project_manager' && '项目专员'}
                {currentUser.role === 'producer' && '制作师傅'}
                {currentUser.role === 'installer' && '安装负责人'}
                {currentUser.role === 'admin' && '管理员'}
              </div>
            </div>
          </div>
          
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-10 transition-transform`}>
          <nav className="p-4">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onMenuChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/30 lg:hidden z-5" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}