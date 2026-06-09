import { useState, useEffect } from 'react'
import { ClipboardList, Warehouse, Headphones, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore, roleConfig } from '@/store'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '@/lib/api'
import type { Role } from '@/types'

interface RoleCounts {
  sales_clerk: number
  warehouse: number
  after_sales: number
  director: number
}

const roleIcons: Record<Role, React.ReactNode> = {
  sales_clerk: <ClipboardList className="h-10 w-10" />,
  warehouse: <Warehouse className="h-10 w-10" />,
  after_sales: <Headphones className="h-10 w-10" />,
  director: <Crown className="h-10 w-10" />,
}

const roleColors: Record<Role, string> = {
  sales_clerk: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400 hover:shadow-blue-100',
  warehouse: 'bg-teal-50 text-teal-600 border-teal-200 hover:border-teal-400 hover:shadow-teal-100',
  after_sales: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100',
  director: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400 hover:shadow-amber-100',
}

const roleEntries: Record<Role, string[]> = {
  sales_clerk: ['客户资质', '采购申请'],
  warehouse: ['待出库', '待发货'],
  after_sales: ['待签收', '资质预警'],
  director: ['审批中心', '进度追踪', '异常提醒'],
}

const roles: Role[] = ['sales_clerk', 'warehouse', 'after_sales', 'director']

export default function RoleEntry() {
  const navigate = useNavigate()
  const { switchRole } = useStore()
  const [counts, setCounts] = useState<RoleCounts>({ sales_clerk: 0, warehouse: 0, after_sales: 0, director: 0 })

  useEffect(() => {
    apiGet<RoleCounts>('/workspace').then((data: any) => {
      if (data?.entries) {
        const total = data.entries.reduce((sum: number, e: any) => sum + (e.count || 0), 0)
        setCounts(prev => ({ ...prev, [data.role]: total }))
      }
    }).catch(() => {})
  }, [])

  async function handleSelect(role: Role) {
    try {
      await switchRole(role)
      navigate('/home')
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-2xl px-4">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-200">
            <ClipboardList className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">口腔耗材商管理系统</h1>
          <p className="mt-2 text-sm text-gray-500">客户资质与采购申请管理 · 替代旧台账与沟通截图</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {roles.map((role) => {
            const config = roleConfig[role]
            return (
              <button
                key={role}
                onClick={() => handleSelect(role)}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:shadow-lg',
                  roleColors[role],
                )}
              >
                {roleIcons[role]}
                <span className="text-base font-semibold">{config.label}</span>
                <span className="text-xs leading-relaxed opacity-70">{config.description}</span>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {roleEntries[role].map((entry) => (
                    <span key={entry} className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-medium">
                      {entry}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          选择角色后进入专属工作台，不同角色看到不同的处理入口和待办事项
        </p>
      </div>
    </div>
  )
}
