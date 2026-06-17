'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Wine,
  LayoutDashboard,
  Package,
  ScanLine,
  Calendar,
  Layers,
  Settings,
  Bell,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle: string
}

const navItems = [
  { label: '首页', href: '/dashboard', icon: LayoutDashboard },
  { label: '酒水寄存', href: '/deposit', icon: Package },
  { label: '取用核销', href: '/redeem', icon: ScanLine },
  { label: '订台管理', href: '/booking', icon: Calendar },
  { label: '批量处理', href: '/batch', icon: Layers },
  { label: '设置', href: '/settings', icon: Settings },
]

export function Header({ title, subtitle }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname() || ''

  const isActive = (href: string) => {
    if (!pathname) return false
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-[#0D1117] border-b border-[#2D3748] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#F5A623] rounded-lg flex items-center justify-center">
                <Wine className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">酒吧运营系统</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    active
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                      : 'text-[#A0AEC0] hover:bg-[#252B3B] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-[#A0AEC0] hover:text-white hover:bg-[#252B3B] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B6B] rounded-full"></span>
            </button>
            <button className="flex items-center gap-2 p-2 text-[#A0AEC0] hover:text-white hover:bg-[#252B3B] rounded-lg transition-colors">
              <User className="w-5 h-5" />
              <span className="text-sm hidden sm:block">管理员</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-[#FF6B6B] hover:bg-[#FF6B6B]/20 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm hidden sm:block">退出</span>
            </button>

            <button
              className="lg:hidden p-2 text-[#A0AEC0] hover:text-white hover:bg-[#252B3B] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="pb-4 border-b border-[#2D3748]">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-sm text-[#A0AEC0]">{subtitle}</p>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-b border-[#2D3748]">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                      : 'text-[#A0AEC0] hover:bg-[#252B3B] hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}