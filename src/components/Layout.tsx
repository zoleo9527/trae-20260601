import { useState } from 'react';
import {
  Calendar,
  Users,
  ClipboardList,
  Activity,
  CalendarClock,
  AlertTriangle,
  BarChart3,
  Home,
  User,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  role: 'coach' | 'manager';
}

const coachNavItems = [
  { path: '/coach', label: '首页', icon: Home },
  { path: '/members', label: '会员管理', icon: Users },
  { path: '/training', label: '训练计划', icon: ClipboardList },
  { path: '/body-measurements', label: '体测记录', icon: Activity },
  { path: '/attendance', label: '上课消耗', icon: CalendarClock },
  { path: '/leave', label: '请假补课', icon: Calendar },
];

const managerNavItems = [
  { path: '/manager', label: '数据大盘', icon: BarChart3 },
  { path: '/members', label: '会员管理', icon: Users },
  { path: '/training', label: '训练计划', icon: ClipboardList },
  { path: '/body-measurements', label: '体测记录', icon: Activity },
  { path: '/attendance', label: '上课消耗', icon: CalendarClock },
  { path: '/leave', label: '请假补课', icon: Calendar },
  { path: '/risks', label: '风险提醒', icon: AlertTriangle },
];

export default function Layout({ children, role }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = role === 'coach' ? coachNavItems : managerNavItems;
  const roleName = role === 'coach' ? '李教练' : '张店长';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-navy-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-navy-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-orange-400">FitPro</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-navy-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-navy-700">
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-navy-800 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{roleName}</p>
                  <p className="text-xs text-gray-400">
                    {role === 'coach' ? '私教教练' : '门店店长'}
                  </p>
                </div>
              )}
              {sidebarOpen && <ChevronDown size={16} />}
            </button>

            {roleDropdownOpen && sidebarOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-navy-800 rounded-lg shadow-xl overflow-hidden">
                <Link
                  to={role === 'coach' ? '/manager' : '/coach'}
                  onClick={() => setRoleDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-navy-700 transition-colors"
                >
                  <User size={18} />
                  <span className="text-sm">
                    切换为{role === 'coach' ? '店长' : '教练'}视角
                  </span>
                </Link>
                <Link
                  to="/"
                  onClick={() => setRoleDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-navy-700 transition-colors text-coral-400"
                >
                  <X size={18} />
                  <span className="text-sm">退出登录</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
