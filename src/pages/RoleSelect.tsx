import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Stethoscope, Flame, Truck, User, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Role } from '../../shared/types'
import { ROLE_LABELS } from '../../shared/types'
import { cn } from '../lib/utils'

const roleConfig: {
  role: Role;
  icon: React.ReactNode;
  color: string;
  description: string;
  responsibilities: string[];
}[] = [
  {
    role: 'PHARMACIST',
    icon: <Stethoscope className="w-8 h-8" />,
    color: 'from-sky-500 to-sky-600',
    description: '负责处方审核，确保用药安全',
    responsibilities: ['处方审核', '用药合理性评估', '录入审核意见'],
  },
  {
    role: 'DECOCTION_STAFF',
    icon: <Flame className="w-8 h-8" />,
    color: 'from-orange-500 to-orange-600',
    description: '负责中药煎制，保证煎药质量',
    responsibilities: ['接收待煎处方', '按规范煎药', '标记煎药完成'],
  },
  {
    role: 'DELIVERY_STAFF',
    icon: <Truck className="w-8 h-8" />,
    color: 'from-teal-500 to-teal-600',
    description: '负责配送管理和签收回查',
    responsibilities: ['配送出库处理', '签收回查确认', '退回原因登记'],
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();
  const { setCurrentRole, setOperatorName } = useAppStore();
  const [operatorName, setOperatorNameInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);

  const handleSelectRole = (role: Role) => {
    if (!operatorName.trim()) {
      return;
    }
    setCurrentRole(role);
    setOperatorName(operatorName.trim());
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg shadow-teal-200 mb-6">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
              <path d="M12 22V12" />
              <path d="M2 7l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            中药煎药房配送管理系统
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            实现处方从审核、煎药、配送至签收的全链路追踪管理，统一数据口径，完整操作留痕
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            操作员姓名
          </label>
          <input
            type="text"
            value={operatorName}
            onChange={(e) => setOperatorNameInput(e.target.value)}
            placeholder="请输入您的姓名"
            className={cn(
              'w-full px-4 py-3 border-2 rounded-xl transition-colors text-lg',
              operatorName.trim()
                ? 'border-teal-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                : 'border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
            )}
          />
          {!operatorName.trim() && (
            <p className="mt-2 text-sm text-amber-600">请先输入操作员姓名后再选择角色</p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roleConfig.map((config) => {
            const isSelected = selectedRole === config.role;
            const isHovered = hoveredRole === config.role;
            const canClick = operatorName.trim();

            return (
              <div
                key={config.role}
                onMouseEnter={() => setHoveredRole(config.role)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => canClick && handleSelectRole(config.role)}
                className={cn(
                  'group relative bg-white rounded-2xl border-2 p-6 transition-all duration-300',
                  canClick
                    ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
                    : 'opacity-60 cursor-not-allowed',
                  isSelected
                    ? 'border-teal-500 shadow-lg shadow-teal-100'
                    : isHovered && canClick
                    ? 'border-teal-300'
                    : 'border-slate-200'
                )}
              >
                <div
                  className={cn(
                    'inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br text-white mb-4 transition-transform duration-300',
                    config.color,
                    isHovered && canClick && 'scale-110'
                  )}
                >
                  {config.icon}
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {ROLE_LABELS[config.role]}
                </h3>
                <p className="text-sm text-slate-500 mb-4">{config.description}</p>

                <div className="space-y-2">
                  {config.responsibilities.map((resp, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>

                <div
                  className={cn(
                    'absolute right-4 top-4 opacity-0 transition-all duration-300',
                    isHovered && canClick && 'opacity-100 translate-x-0'
                  )}
                >
                  <ChevronRight className="w-5 h-5 text-teal-500" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl">
          <h4 className="font-medium text-amber-800 mb-2">轻量实现说明</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• 账号体系：使用角色选择模拟登录，无真实用户认证</li>
            <li>• 附件上传：仅提供上传入口 UI，无真实文件存储</li>
            <li>• 第三方通知：无短信/微信/快递 API 对接</li>
            <li>• 数据持久化：使用内存存储，刷新页面数据保留但不跨设备</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
