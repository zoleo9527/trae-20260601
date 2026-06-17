'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Settings, Users, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react'

const settingsNav = [
  {
    name: '系统设置',
    href: '/settings',
    icon: Settings,
  },
  {
    name: '用户管理',
    href: '/settings/users',
    icon: Users,
  },
  {
    name: '酒水品类',
    href: '/settings/categories',
    icon: Settings,
  },
]

interface User {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'manager' | 'bar' | 'service'
  createdAt: string
  status: 'active' | 'disabled'
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    displayName: '管理员',
    role: 'admin',
    createdAt: '2024-01-01',
    status: 'active',
  },
  {
    id: '2',
    username: 'bar',
    displayName: '吧台小李',
    role: 'bar',
    createdAt: '2024-02-15',
    status: 'active',
  },
  {
    id: '3',
    username: 'service',
    displayName: '客服小王',
    role: 'service',
    createdAt: '2024-03-20',
    status: 'active',
  },
  {
    id: '4',
    username: 'manager',
    displayName: '经理张总',
    role: 'manager',
    createdAt: '2024-01-15',
    status: 'active',
  },
]

const roleColors = {
  admin: 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
  manager: 'bg-[#F5A623]/20 text-[#F5A623]',
  bar: 'bg-[#00D9FF]/20 text-[#00D9FF]',
  service: 'bg-[#4ECDC4]/20 text-[#4ECDC4]',
}

const roleText = {
  admin: '管理员',
  manager: '经理',
  bar: '吧台',
  service: '客服',
}

export default function UsersPage() {
  const [users] = useState(mockUsers)

  return (
    <div className="min-h-screen">
      <Header title="用户管理" subtitle="管理系统用户和权限" />

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 侧边导航 */}
            <div className="space-y-2">
              {settingsNav.map((item) => {
                const Icon = item.icon
                const isActive = item.href === '/settings/users'

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

            {/* 用户列表 */}
            <div className="md:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">用户列表</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20">
                  <Plus className="w-5 h-5" />
                  添加用户
                </button>
              </div>

              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#0D1117] border-b border-[#2D3748]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase">
                        用户名
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase">
                        姓名
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase">
                        角色
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase">
                        创建时间
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase">
                        状态
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3748]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#252B3B] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-white">{user.username}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {user.displayName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
                          >
                            {roleText[user.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A0AEC0]">
                          {user.createdAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]'
                                : 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
                            }`}
                          >
                            {user.status === 'active' ? '正常' : '禁用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 text-[#00D9FF] hover:bg-[#00D9FF]/10 rounded transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded transition-colors"
                              disabled={user.role === 'admin'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
