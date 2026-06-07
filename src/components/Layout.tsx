import { Home, FileCheck, Bell, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '工作台', icon: Home },
    { path: '/history', label: '历史记录', icon: FileCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">加油站班结差异复核</h1>
                <p className="text-xs text-gray-500">运营管理系统</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-700" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">王站长</p>
                  <p className="text-xs text-gray-500">管理员</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-60 hidden md:block bg-white border-r border-gray-200 min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
