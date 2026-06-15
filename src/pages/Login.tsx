import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Wrench, ShieldAlert, Store, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@shared/types';
import { ROLE_DEFAULT_ENTRY } from '@shared/types';

interface RoleCard {
  role: UserRole;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof User;
  color: string;
  borderColor: string;
  accentColor: string;
}

const roleCards: RoleCard[] = [
  {
    role: 'RECEPTION',
    title: '前台',
    subtitle: 'Reception',
    description: '创建工单、录入客户车辆信息、查看报价确认结果',
    icon: User,
    color: 'bg-brass-600',
    borderColor: 'border-brass-500',
    accentColor: 'hover:border-brass-400',
  },
  {
    role: 'TECHNICIAN',
    title: '技师',
    subtitle: 'Technician',
    description: '领取工单、执行轮胎选型、提交选型方案及依据材料',
    icon: Wrench,
    color: 'bg-ochre-700',
    borderColor: 'border-ochre-600',
    accentColor: 'hover:border-ochre-500',
  },
  {
    role: 'MANAGER',
    title: '店长',
    subtitle: 'Manager',
    description: '审核报价、确认或驳回、回溯操作记录、处理异常工单',
    icon: ShieldAlert,
    color: 'bg-carbon-800',
    borderColor: 'border-carbon-700',
    accentColor: 'hover:border-carbon-500',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState<UserRole | null>(null);

  const handleLogin = async (role: UserRole) => {
    setLoading(role);
    const res = await api.login(role);
    if (res.code === 0 && res.data) {
      setUser({
        id: res.data.id,
        name: res.data.name,
        role: res.data.role as UserRole,
        username: res.data.username,
      });
      navigate(ROLE_DEFAULT_ENTRY[role].path);
    } else {
      alert(res.message);
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen grain-bg flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-14 h-14 bg-ochre-800 flex items-center justify-center">
            <Store size={32} strokeWidth={2} className="text-white" />
          </div>
          <div className="text-left">
            <h1 className="font-display text-5xl tracking-[0.2em] text-carbon-800 leading-none">
              TIRE SHOP
            </h1>
            <p className="font-mono text-xs text-carbon-500 uppercase tracking-[0.3em] mt-1">
              轮胎选型与报价确认系统
            </p>
          </div>
        </div>
        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-ochre-600 to-transparent mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {roleCards.map((card, idx) => {
          const Icon = card.icon;
          const isLoading = loading === card.role;
          return (
            <button
              key={card.role}
              onClick={() => handleLogin(card.role)}
              disabled={loading !== null}
              className={`group card p-8 text-left border-2 ${card.borderColor} ${card.accentColor} transition-all duration-300 hover:-translate-y-1 animate-slide-up disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`w-14 h-14 ${card.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={28} strokeWidth={2} className="text-white" />
              </div>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="font-display text-4xl tracking-wider text-carbon-800">
                  {card.title}
                </h2>
                <span className="font-mono text-xs text-carbon-400 uppercase tracking-widest">
                  {card.subtitle}
                </span>
              </div>
              <p className="font-mono text-sm text-carbon-500 leading-relaxed mb-6 min-h-[3.5rem]">
                {card.description}
              </p>
              <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider">
                <span className={isLoading ? 'text-carbon-400' : `text-${card.role === 'MANAGER' ? 'carbon' : card.role === 'TECHNICIAN' ? 'ochre' : 'brass'}-700`}>
                  {isLoading ? '登录中...' : '进入系统'}
                </span>
                <ChevronRight
                  size={18}
                  strokeWidth={2}
                  className={`transition-transform duration-300 group-hover:translate-x-1 ${
                    card.role === 'MANAGER'
                      ? 'text-carbon-600'
                      : card.role === 'TECHNICIAN'
                      ? 'text-ochre-600'
                      : 'text-brass-600'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-16 font-mono text-xs text-carbon-400 uppercase tracking-widest animate-fade-in">
        请选择角色身份进入系统 · 轮胎选型责任与报价确认责任在此分离
      </div>
    </div>
  );
}
