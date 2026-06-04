import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Beer, Package, ShoppingBag, ClipboardList, AlertTriangle, CheckCircle2, FlaskConical, Send } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBatchStore } from '@/store/useBatchStore';
import { MOCK_DATA_LOCATIONS, ROLE_ENTRIES, UNIMPLEMENTED_INTEGRATIONS } from '@/types';
import type { UserRole } from '@/types';

const roles: Array<{
  role: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  actionLabel: string;
  actionIcon: React.ReactNode;
  actionColor: string;
  features: string[];
}> = [
  {
    role: 'brewer',
    title: '酿酒师',
    description: '管理发酵过程，发起品控检测申请',
    icon: <Beer className="w-10 h-10" />,
    color: 'text-amber-900',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    actionLabel: '发起品控检测',
    actionIcon: <ClipboardList className="w-5 h-5" />,
    actionColor: 'bg-amber-900 hover:bg-amber-800 text-white',
    features: ['查看发酵罐记录', '发起品控检测申请', '查看检测结果和备注'],
  },
  {
    role: 'packaging',
    title: '包装主管',
    description: '执行品控检测，处理异常批次',
    icon: <Package className="w-10 h-10" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    actionLabel: '执行品控检测',
    actionIcon: <FlaskConical className="w-5 h-5" />,
    actionColor: 'bg-blue-700 hover:bg-blue-800 text-white',
    features: ['待检测批次处理', '填写检测数据+备注', '批量检测操作', '异常标注处理'],
  },
  {
    role: 'sales',
    title: '销售内勤',
    description: '放行判断，对接经销商发货',
    icon: <ShoppingBag className="w-10 h-10" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    actionLabel: '放行判断',
    actionIcon: <Send className="w-5 h-5" />,
    actionColor: 'bg-purple-700 hover:bg-purple-800 text-white',
    features: ['待放行批次审核', '品控备注回看', '放行/拒签操作', '批量放行'],
  },
];

export function RoleSelect() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const batches = useBatchStore((state) => state.batches);

  const stats = {
    pending: batches.filter((b) => b.currentStatus === 'PENDING_TEST').length,
    testing: batches.filter((b) => b.currentStatus === 'TESTING').length,
    abnormal: batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL').length,
    passed: batches.filter((b) => b.currentStatus === 'TEST_PASSED').length,
    released: batches.filter((b) => b.currentStatus === 'RELEASED').length,
    rejected: batches.filter((b) => b.currentStatus === 'REJECTED').length,
  };

  const rolePendingCounts: Record<UserRole, number> = {
    brewer: stats.pending,
    packaging: stats.pending + stats.testing,
    sales: stats.passed + stats.abnormal,
  };

  const handleRoleSelect = (role: UserRole) => {
    login(role);
    const routes: Record<UserRole, string> = {
      brewer: '/brewer',
      packaging: '/packaging',
      sales: '/sales',
    };
    navigate(routes[role]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-hop-green/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-amber-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Beer className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            精酿工坊 · 品控中心
          </h1>
          <p className="text-neutral-600 text-lg">品控检测与放行判断交班系统</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-4 gap-4 mb-10"
        >
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-amber-100">
            <div className="flex items-center gap-2 text-amber-900 mb-1">
              <ClipboardList className="w-4 h-4" />
              <span className="text-sm font-medium">待检测</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <ClipboardList className="w-4 h-4" />
              <span className="text-sm font-medium">检测中</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.testing}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-warning-orange/20">
            <div className="flex items-center gap-2 text-warning-orange mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">异常批次</span>
            </div>
            <p className="text-2xl font-bold text-warning-orange">{stats.abnormal + stats.rejected}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-hop-green/20">
            <div className="flex items-center gap-2 text-hop-green mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">已放行</span>
            </div>
            <p className="text-2xl font-bold text-hop-green">{stats.released}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {roles.map((roleConfig, index) => (
            <motion.div
              key={roleConfig.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => handleRoleSelect(roleConfig.role)}
            >
              <div className={`h-full ${roleConfig.bgColor} rounded-2xl p-6 shadow-lg border ${roleConfig.borderColor} transition-all duration-300 hover:shadow-xl`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-xl ${roleConfig.color} bg-white shadow-md flex items-center justify-center`}>
                    {roleConfig.icon}
                  </div>
                  {rolePendingCounts[roleConfig.role] > 0 && (
                    <span className="bg-warning-orange text-white text-sm px-3 py-1 rounded-full font-medium">
                      {rolePendingCounts[roleConfig.role]} 待处理
                    </span>
                  )}
                </div>

                <h2 className={`text-xl font-bold ${roleConfig.color} mb-2`}>
                  {roleConfig.title}
                </h2>
                <p className="text-neutral-600 text-sm mb-4">
                  {roleConfig.description}
                </p>

                <ul className="space-y-2 mb-4">
                  {roleConfig.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                      <div className={`w-1.5 h-1.5 rounded-full ${roleConfig.color.replace('text-', 'bg-')}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${roleConfig.actionColor}`}>
                  {roleConfig.actionIcon}
                  {roleConfig.actionLabel}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12"
        >
          <div className="bg-white/60 backdrop-blur rounded-xl p-6 border border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800 mb-4">系统信息</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-xs font-medium text-neutral-500 mb-2">模拟数据位置</h4>
                <ul className="space-y-1">
                  {Object.entries(MOCK_DATA_LOCATIONS).map(([key, path]) => (
                    <li key={key} className="text-xs text-neutral-600">
                      <code className="bg-amber-100 px-1.5 py-0.5 rounded">{key}</code>: {path}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-neutral-500 mb-2">角色入口</h4>
                <ul className="space-y-1">
                  {Object.entries(ROLE_ENTRIES).map(([role, entry]) => (
                    <li key={role} className="text-xs text-neutral-600">
                      <code className="bg-amber-100 px-1.5 py-0.5 rounded">{entry.label}</code>: {entry.path}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-neutral-500 mb-2">暂未实现的集成点</h4>
                <ul className="space-y-1">
                  {UNIMPLEMENTED_INTEGRATIONS.map((integration) => (
                    <li key={integration.name} className="text-xs text-neutral-600">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${integration.priority === '高' ? 'bg-red-500' : integration.priority === '中' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      {integration.name} ({integration.priority}优先级 · {integration.method})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
