import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  PawPrint,
  Stethoscope,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useStore, Role, RescueStatus, MedicalStatus } from '@/store';
import RoleSwitcher from './RoleSwitcher';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentRole, animals } = useStore();

  const navItems = [
    { path: '/', label: '今日待办', icon: Home },
    { path: '/rescue', label: '救助登记', icon: PawPrint },
    { path: '/medical', label: '医疗评估', icon: Stethoscope },
    { path: '/settings', label: '备份设置', icon: Settings },
  ];

  const pendingRescueCount = animals.filter(
    (a) => a.status === RescueStatus.PENDING || a.status === RescueStatus.REGISTERED
  ).length;

  const pendingMedicalCount = animals.filter(
    (a) => a.medicalStatus === MedicalStatus.NOT_ASSESSED && a.status !== RescueStatus.CLOSED
  ).length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {sidebarOpen && (
            <span className="ml-3 font-semibold text-gray-800 truncate">动物救助站</span>
          )}
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const showBadge =
              item.path === '/rescue' && pendingRescueCount > 0
                ? pendingRescueCount
                : item.path === '/medical' && pendingMedicalCount > 0
                ? pendingMedicalCount
                : null;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                {showBadge && sidebarOpen && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {showBadge}
                  </span>
                )}
                {showBadge && !sidebarOpen && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <RoleSwitcher />
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">
            {navItems.find((n) => n.path === location.pathname)?.label || '动物救助站'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              当前角色:{' '}
              <span className="font-medium text-gray-700">
                {currentRole === Role.VOLUNTEER
                  ? '救助志愿者'
                  : currentRole === Role.VET
                  ? '兽医'
                  : '领养审核员'}
              </span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
