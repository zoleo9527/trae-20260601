import { NavLink } from 'react-router-dom';
import { ClipboardList, Home, Plus, History } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { path: '/', icon: Home, label: '待办工作台' },
    { path: '/complaints', icon: ClipboardList, label: '投诉记录' },
    { path: '/complaints/new', icon: Plus, label: '新建投诉' },
  ];

  return (
    <aside className="w-64 bg-navy-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-navy-800">
        <h1 className="text-xl font-serif font-bold text-white">球馆运营系统</h1>
        <p className="text-navy-300 text-sm mt-1">投诉补偿处理</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive
                  ? 'bg-navy-700 text-white'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-navy-800">
        <div className="text-navy-400 text-xs">
          <p>© 2026 球馆运营管理系统</p>
        </div>
      </div>
    </aside>
  );
}
