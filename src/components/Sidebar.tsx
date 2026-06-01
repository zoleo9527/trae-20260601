import { useStore } from '@/store'
import type { Role } from '@/types'
import { CalendarCheck, ClipboardList, Home, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navByRole: Record<Role, { to: string; icon: React.ReactNode; label: string }[]> = {
  doctor: [
    { to: '/', icon: <Home size={18} />, label: '住院总览' },
  ],
  nurse: [
    { to: '/', icon: <Home size={18} />, label: '住院总览' },
    { to: '/tasks', icon: <ClipboardList size={18} />, label: '今日任务' },
  ],
  receptionist: [
    { to: '/', icon: <Home size={18} />, label: '住院总览' },
    { to: '/followups', icon: <CalendarCheck size={18} />, label: '复诊提醒' },
  ],
}

const roleColors: Record<Role, { bg: string; text: string; border: string; active: string }> = {
  doctor: { bg: 'bg-vet-teal-light', text: 'text-vet-teal', border: 'border-vet-teal/20', active: 'bg-vet-teal' },
  nurse: { bg: 'bg-vet-sky-light', text: 'text-vet-sky', border: 'border-vet-sky/20', active: 'bg-vet-sky' },
  receptionist: { bg: 'bg-vet-violet-light', text: 'text-vet-violet', border: 'border-vet-violet/20', active: 'bg-vet-violet' },
}

const roleLabels: Record<Role, string> = {
  doctor: '医生端',
  nurse: '护士端',
  receptionist: '前台端',
}

export default function Sidebar() {
  const { role } = useStore()
  const colors = roleColors[role]
  const navItems = navByRole[role]

  return (
    <aside className={`w-56 min-h-screen ${colors.bg} border-r ${colors.border} flex flex-col`}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-8 h-8 rounded-lg ${colors.active} flex items-center justify-center`}>
            <span className="text-white text-sm font-bold">宠</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">住院护理系统</h1>
          </div>
        </div>
        <span className={`text-xs font-medium ${colors.text} opacity-70`}>{roleLabels[role]}</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${colors.active} text-white shadow-sm`
                  : `${colors.text} hover:bg-white/60`
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200/50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <User size={14} />
          <span>演示账号 · {roleLabels[role]}</span>
        </div>
      </div>
    </aside>
  )
}
