import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { path: '/workbench', icon: LayoutDashboard, label: '工作台', exact: true },
  { path: '/workbench/dispatch', icon: Users, label: '派工管理' },
  { path: '/workbench/exceptions', icon: AlertTriangle, label: '异常中心' },
  { path: '/workbench/dashboard', icon: BarChart3, label: '数据看板' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-[#16213e] border-r border-[#1a1a2e] flex flex-col">
      <div className="p-4 border-b border-[#1a1a2e]">
        <h1 className="text-lg font-bold text-[#eaeaea]">轮胎门店管理系统</h1>
        <p className="text-xs text-[#a0a0a0] mt-1">安装工单与技师派工</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-[#1a1a2e]',
                isActive
                  ? 'bg-[#1a1a2e] text-[#e94560]'
                  : 'text-[#a0a0a0] hover:text-[#eaeaea]'
              )
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#1a1a2e]">
        <div className="bg-[#1a1a2e] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#f39c12] animate-pulse" />
            <span className="text-xs text-[#a0a0a0]">系统状态</span>
          </div>
          <p className="text-sm text-[#eaeaea] font-medium">运行正常</p>
          <p className="text-xs text-[#a0a0a0] mt-1">
            {new Date().toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>
    </aside>
  );
}
