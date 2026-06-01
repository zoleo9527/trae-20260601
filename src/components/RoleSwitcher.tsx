import { useStore } from '@/store';
import type { Role } from '@/types';
import { ClipboardList, HeadphonesIcon, Stethoscope } from 'lucide-react';

const roles: { key: Role; label: string; icon: React.ReactNode; color: string; bgColor: string; activeBg: string }[] = [
  { key: 'doctor', label: '医生', icon: <Stethoscope size={16} />, color: 'text-vet-teal', bgColor: 'bg-vet-teal-light', activeBg: 'bg-vet-teal' },
  { key: 'nurse', label: '住院护士', icon: <ClipboardList size={16} />, color: 'text-vet-sky', bgColor: 'bg-vet-sky-light', activeBg: 'bg-vet-sky' },
  { key: 'receptionist', label: '前台客服', icon: <HeadphonesIcon size={16} />, color: 'text-vet-violet', bgColor: 'bg-vet-violet-light', activeBg: 'bg-vet-violet' },
]

export default function RoleSwitcher() {
  const { role, setRole } = useStore()

  return (
    <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm border border-slate-200">
      {roles.map((r) => (
        <button
          key={r.key}
          onClick={() => setRole(r.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            role === r.key
              ? `${r.activeBg} text-white shadow-sm`
              : `${r.bgColor} ${r.color} hover:opacity-80`
          }`}
        >
          {r.icon}
          {r.label}
        </button>
      ))}
    </div>
  )
}
