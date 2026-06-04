import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  Settings,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/surgeries', label: '手术列表', icon: Calendar },
  { path: '/exceptions', label: '异常中心', icon: AlertTriangle },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">眼科手术中心</h1>
            <p className="text-xs text-slate-400">晶体预留与耗材核销</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
          <span>系统设置</span>
        </button>
      </div>
    </aside>
  );
}
