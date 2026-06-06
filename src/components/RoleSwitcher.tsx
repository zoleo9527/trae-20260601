import { useStore, Role } from '@/store';
import { Users, Stethoscope, ClipboardCheck } from 'lucide-react';

export default function RoleSwitcher() {
  const { currentRole, setRole } = useStore();

  const roles = [
    { value: Role.VOLUNTEER, label: '救助志愿者', icon: Users },
    { value: Role.VET, label: '兽医', icon: Stethoscope },
    { value: Role.ADOPTION_REVIEWER, label: '领养审核员', icon: ClipboardCheck },
  ];

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">切换角色视图</p>
      <div className="space-y-1">
        {roles.map((role) => {
          const Icon = role.icon;
          const isActive = currentRole === role.value;
          return (
            <button
              key={role.value}
              onClick={() => setRole(role.value)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              <span className="ml-2">{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
