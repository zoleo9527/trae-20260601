import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Bell, Settings, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { UserRole } from '@shared/types';

const roleLabels: Record<UserRole, string> = {
  sales: '宴会销售',
  hall_manager: '厅面主管',
  kitchen_manager: '后厨主管',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { currentRole, setRole, alerts } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const isKitchenRole = currentRole === 'kitchen_manager';
  const visibleAlerts = isKitchenRole
    ? alerts.filter(a => a.scope === 'kitchen' || a.scope === 'both')
    : alerts;
  const unreadAlerts = visibleAlerts.filter(a => !a.acknowledged).length;

  const navItems = [
    { path: '/', label: '宴会概览', icon: Calendar },
    { path: '/alerts', label: '变更提醒', icon: Bell, badge: unreadAlerts },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-wine-800 to-wine-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden p-2 hover:bg-wine-700 rounded-lg transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-champagne-400 to-champagne-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="font-display text-wine-900 font-bold text-lg">宴</span>
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold tracking-wide">宴会部管理系统</h1>
                  <p className="text-xs text-champagne-300">桌型方案 · 物资清单 · 变更追踪</p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive(item.path)
                      ? 'bg-champagne-500 text-wine-900 font-medium shadow-md'
                      : 'hover:bg-wine-700/50 text-wine-100'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse-slow">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-wine-700/50 hover:bg-wine-700 rounded-lg transition-colors border border-wine-600"
                >
                  <Users size={16} className="text-champagne-400" />
                  <span className="text-sm">{roleLabels[currentRole]}</span>
                  <ChevronDown size={14} />
                </button>
                {roleDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px] z-50">
                    {(['sales', 'hall_manager', 'kitchen_manager'] as UserRole[]).map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          setRole(role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-champagne-50 transition-colors ${
                          currentRole === role ? 'bg-champagne-100 text-wine-800 font-medium' : ''
                        }`}
                      >
                        {roleLabels[role]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="p-2 hover:bg-wine-700/50 rounded-lg transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-wine-700 py-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 ${
                  isActive(item.path)
                    ? 'bg-champagne-500/20 text-champagne-300'
                    : 'text-wine-100'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-wine-900/5 text-wine-800 py-4 border-t border-champagne-200">
        <div className="container mx-auto px-4 text-center text-sm">
          <p className="font-display">© 2026 宴会部桌型方案管理系统 · 会前准备 · 全流程协同</p>
        </div>
      </footer>
    </div>
  );
}
