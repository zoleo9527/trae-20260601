import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  ClipboardList, 
  Package, 
  Download, 
  Menu, 
  X,
  AlertTriangle
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: '实验课程', icon: BookOpen },
    { path: '/materials', label: '材料领用', icon: Package },
    { path: '/backup', label: '备份恢复', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-primary-600" />
              <span className="text-lg font-bold text-gray-800">科技馆展教</span>
            </div>
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">责任提示</span>
              </div>
              <p className="text-xs text-amber-700">
                实验课程与材料领用之间的责任划分需明确标注，避免责任不清。
              </p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="md:ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {location.pathname === '/' && '实验课程管理'}
              {location.pathname === '/materials' && '材料领用管理'}
              {location.pathname === '/backup' && '数据备份恢复'}
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                当前用户：展教员
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
