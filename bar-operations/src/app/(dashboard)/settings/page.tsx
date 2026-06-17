'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Settings, Users, Package, ChevronRight } from 'lucide-react'

const settingsNav = [
  {
    name: '系统设置',
    href: '/settings',
    icon: Settings,
    description: '基础配置和参数设置',
  },
  {
    name: '用户管理',
    href: '/settings/users',
    icon: Users,
    description: '用户账号和权限管理',
  },
  {
    name: '酒水品类',
    href: '/settings/categories',
    icon: Package,
    description: '酒水品类和有效期设置',
  },
]

export default function SettingsPage() {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      <Header title="系统设置" subtitle="管理和配置系统参数" />

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 侧边导航 */}
            <div className="space-y-2">
              {settingsNav.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#00D9FF]/10 border border-[#00D9FF] text-[#00D9FF]'
                        : 'bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] hover:bg-[#252B3B] hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )
              })}
            </div>

            {/* 设置内容 */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-6">基础设置</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                      默认寄存有效期（天）
                    </label>
                    <input
                      type="number"
                      defaultValue={30}
                      className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#00D9FF] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                      超期提醒提前天数
                    </label>
                    <input
                      type="number"
                      defaultValue={7}
                      className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#00D9FF] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                      异常核销阈值（次/天）
                    </label>
                    <input
                      type="number"
                      defaultValue={10}
                      className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#00D9FF] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                      系统名称
                    </label>
                    <input
                      type="text"
                      defaultValue="酒吧运营系统"
                      className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#00D9FF] transition-all"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#2D3748]">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white font-medium rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20">
                    保存设置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
