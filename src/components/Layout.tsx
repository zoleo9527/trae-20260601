import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, CheckSquare, Stethoscope, UserCog, Monitor } from 'lucide-react';
import { useStore } from '@/store/useStore';

const navItems = [
  { path: '/', label: '复评总览', icon: ClipboardList },
  { path: '/approval', label: '审批工作台', icon: CheckSquare },
];

const roleConfig = {
  '治疗师': { icon: Stethoscope, color: 'bg-teal-100 text-teal-700' },
  '主任': { icon: UserCog, color: 'bg-amber-100 text-amber-700' },
  '前台': { icon: Monitor, color: 'bg-sky-100 text-sky-700' },
};

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { currentRole, setRole } = useStore();

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">康复复评系统</h1>
              <p className="text-xs text-slate-400">疗程复评与续疗判断</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/reassessment')) || (item.path === '/' && location.pathname.startsWith('/followup'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-2">当前角色</p>
            <div className="flex gap-1">
              {(['治疗师', '主任', '前台'] as const).map((role) => {
                const config = roleConfig[role];
                return (
                  <button
                    key={role}
                    onClick={() => setRole(role)}
                    className={`flex-1 py-1.5 px-1 rounded-md text-xs font-medium transition-colors ${
                      currentRole === role
                        ? config.color
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>康复治疗中心</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">
              {location.pathname === '/' && '复评总览'}
              {location.pathname.startsWith('/reassessment') && '复评记录详情'}
              {location.pathname === '/approval' && '审批工作台'}
              {location.pathname.startsWith('/followup') && '续疗计划与沟通'}
            </span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig[currentRole].color}`}>
            {(() => { const Icon = roleConfig[currentRole].icon; return <Icon className="w-3 h-3" />; })()}
            {currentRole}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
