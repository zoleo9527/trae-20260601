import { useState, useRef, useEffect } from 'react'
import { ClipboardList, Warehouse, Headphones, Crown, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore, roleConfig } from '@/store'
import type { Role } from '@/types'

const roleIcons: Record<Role, React.ReactNode> = {
  sales_clerk: <ClipboardList className="h-5 w-5" />,
  warehouse: <Warehouse className="h-5 w-5" />,
  after_sales: <Headphones className="h-5 w-5" />,
  director: <Crown className="h-5 w-5" />,
}

const roleColors: Record<Role, string> = {
  sales_clerk: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
  warehouse: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100',
  after_sales: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100',
  director: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100',
}

const roleActiveColors: Record<Role, string> = {
  sales_clerk: 'ring-2 ring-blue-400 bg-blue-100',
  warehouse: 'ring-2 ring-teal-400 bg-teal-100',
  after_sales: 'ring-2 ring-indigo-400 bg-indigo-100',
  director: 'ring-2 ring-amber-400 bg-amber-100',
}

const roles: Role[] = ['sales_clerk', 'warehouse', 'after_sales', 'director']

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { session, switchRole } = useStore()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSwitch(role: Role) {
    try {
      await switchRole(role)
      window.location.reload()
    } catch {
      // ignore
    }
    setOpen(false)
  }

  if (!session) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
          roleColors[session.role],
        )}
      >
        <span>{roleConfig[session.role].label}</span>
        <span className="text-gray-400">·</span>
        <span>{session.name}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
          <p className="mb-2 px-1 text-xs font-medium text-gray-400">切换角色</p>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => {
              const config = roleConfig[role]
              const isActive = session.role === role
              return (
                <button
                  key={role}
                  onClick={() => handleSwitch(role)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all',
                    roleColors[role],
                    isActive && roleActiveColors[role],
                  )}
                >
                  {roleIcons[role]}
                  <span className="text-xs font-medium">{config.label}</span>
                  <span className="text-[10px] leading-tight opacity-70">{config.description}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
