import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/hooks/useStore'

const routeTitles: Record<string, string> = {
  '/': '工作台',
  '/containers': '箱号清单',
  '/gate-records': '闸口记录',
  '/yard-map': '堆位图',
  '/overstay': '超期堆存',
  '/fee-review': '费用复核',
  '/inspection': '查验计划',
}

const roles = [
  { key: 'gate_operator' as const, label: '闸口员' },
  { key: 'dispatcher' as const, label: '调度' },
  { key: 'customer_service' as const, label: '客服' },
]

export default function RoleSwitcher() {
  const location = useLocation()
  const { currentRole, setCurrentRole } = useAppStore()

  const title =
    routeTitles[location.pathname] ||
    (location.pathname.startsWith('/containers/') ? '箱号详情' : '')

  return (
    <header className="bg-port-navy h-14 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-white font-medium text-base">{title}</h1>
      <div className="flex items-center gap-2">
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => setCurrentRole(role.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              currentRole === role.key
                ? 'bg-port-orange text-white'
                : 'border border-white/20 text-gray-300 hover:bg-white/10'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>
    </header>
  )
}
