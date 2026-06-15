import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, AlertTriangle, History } from 'lucide-react';

const menuItems = [
  { path: '/', label: '订单看板', icon: LayoutDashboard },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { path: '/history', label: '操作历史', icon: History },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-65px)] overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-2">快捷操作</h3>
          <button
            onClick={() => navigate('/')}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            <span>新建订单</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
