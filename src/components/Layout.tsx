import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, FileText, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import RoleSwitcher from '@/components/RoleSwitcher';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '员工总览', icon: LayoutDashboard },
  { path: '/training', label: '入场培训', icon: GraduationCap },
  { path: '/documents', label: '证件收集', icon: FileText },
  { path: '/settings/reset', label: '数据重置', icon: Settings },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper flex">
      <aside className="hidden lg:flex w-64 flex-col border-r border-ink-100 bg-white">
        <div className="h-16 flex items-center px-6 border-b border-ink-100">
          <h1 className="font-serif text-lg font-semibold text-brand-700">
            派遣管理系统
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm transition-all',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium border border-brand-100'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                )
              }
            >
              <item.icon size={18} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-ink-100">
          <RoleSwitcher />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-ink-100 flex items-center justify-between px-6 lg:hidden">
          <h1 className="font-serif text-base font-semibold text-brand-700">
            派遣管理系统
          </h1>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-ink-100 p-4 animate-fade-in">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-ink-600 hover:bg-ink-50'
                    )
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-ink-100">
              <RoleSwitcher />
            </div>
          </div>
        )}

        <header className="hidden lg:flex h-16 bg-white border-b border-ink-100 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-ink-500 text-sm">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </h2>
          </div>
          <RoleSwitcher horizontal />
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
