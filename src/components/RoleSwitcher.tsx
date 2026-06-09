import { Stethoscope, Heart, Shield } from 'lucide-react'
import { useRoleStore } from '@/store/useRoleStore'
import { ROLE_LABELS } from '@/types'
import type { Role } from '@/types'

const roleConfig: { role: Role; icon: React.ElementType }[] = [
  { role: 'doctor', icon: Stethoscope },
  { role: 'nurse', icon: Heart },
  { role: 'ph_specialist', icon: Shield },
]

export default function RoleSwitcher() {
  const { currentRole, setRole } = useRoleStore()

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 shadow-sm border border-slate-100">
      {roleConfig.map(({ role, icon: Icon }) => {
        const active = currentRole === role
        return (
          <button
            key={role}
            onClick={() => setRole(role)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              active
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {ROLE_LABELS[role]}
          </button>
        )
      })}
    </div>
  )
}
