import { Users, MapPin, Truck, Shield } from 'lucide-react';
import type { User, Role } from '../types';

interface RoleSelectorProps {
  onLogin: (user: User) => void;
}

const ROLE_CARDS: { user: User; icon: React.ReactNode; desc: string }[] = [
  {
    user: { id: 'op1', name: '王计调', role: 'operator' as Role },
    icon: <Users className="w-8 h-8" />,
    desc: '负责投诉登记、指派处理、提出补偿方案',
  },
  {
    user: { id: 'guide1', name: '李导游', role: 'guide' as Role },
    icon: <MapPin className="w-8 h-8" />,
    desc: '接收投诉处理指派、添加处理备注',
  },
  {
    user: { id: 'fleet1', name: '张调度', role: 'fleet' as Role },
    icon: <Truck className="w-8 h-8" />,
    desc: '接收运输相关投诉处理指派、添加处理备注',
  },
  {
    user: { id: 'supervisor1', name: '赵主管', role: 'supervisor' as Role },
    icon: <Shield className="w-8 h-8" />,
    desc: '查看全局进度、审批补偿方案',
  },
];

const ROLE_LABELS: Record<Role, string> = {
  operator: '计调',
  guide: '导游',
  fleet: '车队调度',
  supervisor: '主管',
};

const ROLE_COLORS: Record<Role, string> = {
  operator: 'bg-blue-500',
  guide: 'bg-emerald-500',
  fleet: 'bg-amber-500',
  supervisor: 'bg-purple-500',
};

export default function RoleSelector({ onLogin }: RoleSelectorProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">投诉登记与补偿跟进</h1>
          <p className="text-slate-500 mt-2">旅游地接社投诉管理系统</p>
        </div>
        <p className="text-center text-slate-600 mb-6">请选择您的角色以进入系统</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLE_CARDS.map(({ user, icon, desc }) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-left hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`${ROLE_COLORS[user.role]} text-white p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-lg">{user.name}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium text-white ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  <p className="text-slate-500 text-sm mt-2">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
