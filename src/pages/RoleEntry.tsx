import { useNavigate } from 'react-router-dom';
import { Headphones, Palette, ShieldCheck, Settings, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Role, ROLE_LABELS } from '@/types';

interface RoleCardProps {
  role: Role;
  icon: React.ReactNode;
  description: string;
  color: string;
  onClick: () => void;
}

function RoleCard({ role, icon, description, color, onClick }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-8 shadow-lg border border-neutral-200 hover:shadow-2xl hover:border-primary-300 transition-all duration-500 transform hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-primary-100"
    >
      <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">
        {ROLE_LABELS[role]}
      </h3>
      <p className="text-neutral-500 mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-2 text-primary-500 font-medium opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
        <span>进入工作台</span>
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </button>
  );
}

export default function RoleEntry() {
  const navigate = useNavigate();
  const setCurrentRole = useAppStore((state) => state.setCurrentRole);

  const handleRoleSelect = (role: Role) => {
    setCurrentRole(role);
    if (role === 'CUSTOMER_SERVICE') {
      navigate('/customer-service');
    } else {
      navigate('/other');
    }
  };

  const roles: { role: Role; icon: React.ReactNode; description: string; color: string }[] = [
    {
      role: 'CUSTOMER_SERVICE',
      icon: <Headphones size={32} className="text-blue-600" />,
      description: '负责客户订单录入、扫描文件上传、客户沟通等工作',
      color: 'bg-blue-50',
    },
    {
      role: 'DESIGNER',
      icon: <Palette size={32} className="text-purple-600" />,
      description: '处理口扫文件、数字模型设计、派单给技师生产',
      color: 'bg-purple-50',
    },
    {
      role: 'QUALITY',
      icon: <ShieldCheck size={32} className="text-green-600" />,
      description: '负责成品质量检验、返工处理、质量记录管理',
      color: 'bg-green-50',
    },
    {
      role: 'ADMIN',
      icon: <Settings size={32} className="text-gray-600" />,
      description: '系统管理、数据统计、人员管理、系统配置',
      color: 'bg-gray-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold text-primary-700 mb-4">
            义齿加工厂扫描派单系统
          </h1>
          <p className="text-xl text-neutral-500 max-w-2xl mx-auto">
            请选择您的角色进入对应工作台，高效管理订单流程
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {roles.map((roleData, index) => (
            <div
              key={roleData.role}
              className="animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <RoleCard
                role={roleData.role}
                icon={roleData.icon}
                description={roleData.description}
                color={roleData.color}
                onClick={() => handleRoleSelect(roleData.role)}
              />
            </div>
          ))}
        </div>

        <div className="mt-20 text-center text-sm text-neutral-400">
          <p>© 2026 义齿加工厂管理系统 · 数字化义齿生产解决方案</p>
        </div>
      </div>
    </div>
  );
}
