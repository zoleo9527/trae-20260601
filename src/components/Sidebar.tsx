'use client'

import { useAuthStore } from '@/lib/auth-store'
import { useRouter, usePathname } from 'next/navigation'
import { UserRole, ROLE_LABELS } from '@/lib/types'
import {
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  LogOut,
  LayoutDashboard,
  User,
} from 'lucide-react'

const navItems: Record<UserRole, { label: string; href: string; icon: React.ReactNode }[]> = {
  THERAPIST: [
    { label: '排班工作台', href: '/therapist/schedule', icon: <Calendar size={20} /> },
  ],
  RECEPTION: [
    { label: '签到消课', href: '/reception/checkin', icon: <ClipboardCheck size={20} /> },
  ],
  DIRECTOR: [
    { label: '预警总览', href: '/director/overview', icon: <AlertTriangle size={20} /> },
    { label: '全局排班', href: '/director/schedule', icon: <LayoutDashboard size={20} /> },
  ],
}

export default function Sidebar() {
  const { userRole, userName, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  if (!userRole) return null

  const items = navItems[userRole]

  return (
    <aside className="w-60 bg-navy-500 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="px-5 py-6 border-b border-navy-400">
        <h1 className="text-lg font-bold tracking-wide">康复治疗中心</h1>
        <p className="text-xs text-navy-200 mt-1">治疗排班与签到消课</p>
      </div>

      <div className="px-5 py-4 border-b border-navy-400 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-400 flex items-center justify-center">
          <User size={18} />
        </div>
        <div>
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-navy-200">{ROLE_LABELS[userRole]}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-navy-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-navy-400">
        <button
          onClick={() => {
            logout()
            router.push('/login')
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-100 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={20} />
          退出登录
        </button>
      </div>
    </aside>
  )
}
