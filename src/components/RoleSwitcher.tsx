import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import type { Role } from '@/types'
import { Headphones, ShieldCheck, Wrench } from 'lucide-react'

const roles: { key: Role; label: string; icon: typeof Wrench }[] = [
  { key: 'technician', label: '维保技师', icon: Wrench },
  { key: 'service', label: '客服', icon: Headphones },
  { key: 'supervisor', label: '项目主管', icon: ShieldCheck },
]

export default function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useStore()

  return (
    <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
      {roles.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setCurrentRole(key)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
            currentRole === key
              ? 'bg-amber-500 text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
