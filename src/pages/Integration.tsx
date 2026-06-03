import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plug,
  User,
  AlertCircle,
  Zap,
  Database,
  MessageSquare,
  Cloud,
  Smartphone,
  DollarSign,
  LogOut,
  Clock,
  Target,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const PRIORITY_CONFIG = {
  high: {
    label: '高优先级',
    color: 'bg-danger-100 text-danger-700 border-danger-200',
    dot: 'bg-danger-500',
  },
  medium: {
    label: '中优先级',
    color: 'bg-warning-100 text-warning-700 border-warning-200',
    dot: 'bg-warning-500',
  },
  low: {
    label: '低优先级',
    color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    dot: 'bg-neutral-500',
  },
};

const INTEGRATION_ICONS: Record<string, React.ReactNode> = {
  '口扫设备对接': <Zap size={24} />,
  '微信消息推送': <MessageSquare size={24} />,
  'ERP 系统对接': <Database size={24} />,
  '财务系统对接': <DollarSign size={24} />,
  '短信通知': <Smartphone size={24} />,
  '云文件存储': <Cloud size={24} />,
};

export default function Integration() {
  const navigate = useNavigate();
  const {
    initMockData,
    integrationPoints,
    currentRole,
    currentUser,
    setCurrentRole,
    setCurrentUser,
  } = useAppStore();

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('ADMIN');
    }
    if (!currentUser) {
      setCurrentUser('系统管理员');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const handleLogout = () => {
    setCurrentRole(null);
    navigate('/');
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
  };

  const getIcon = (name: string) => {
    return INTEGRATION_ICONS[name] || <Plug size={24} />;
  };

  const sortedPoints = [...integrationPoints].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (
      priorityOrder[a.priority as keyof typeof priorityOrder] -
      priorityOrder[b.priority as keyof typeof priorityOrder]
    );
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-neutral-600" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Plug size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">集成点说明</h1>
                <p className="text-xs text-neutral-500">外部系统集成规划</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{currentUser || '未登录'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Plug size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">外部系统集成规划</h2>
              <p className="text-white/80">
                以下为系统规划中暂未实现的外部系统集成点。这些集成点将在后续版本中逐步实现，
                以提升系统的自动化程度和数据流转效率。
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: '待实现集成点',
              value: sortedPoints.length,
              color: 'text-primary-600',
              bg: 'bg-primary-50',
            },
            {
              label: '高优先级',
              value: sortedPoints.filter((p) => p.priority === 'high').length,
              color: 'text-danger-600',
              bg: 'bg-danger-50',
            },
            {
              label: '中优先级',
              value: sortedPoints.filter((p) => p.priority === 'medium').length,
              color: 'text-warning-600',
              bg: 'bg-warning-50',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Target size={24} className={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-800">集成点列表</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  按优先级排序，点击卡片查看详情
                </p>
              </div>
              <span className="px-3 py-1 bg-warning-100 text-warning-700 text-sm rounded-full font-medium flex items-center gap-1.5">
                <Clock size={14} />
                待实现
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedPoints.map((point) => {
                const priorityConfig = getPriorityConfig(point.priority);

                return (
                  <div
                    key={point.id}
                    className="group relative bg-gradient-to-br from-neutral-50 to-white rounded-xl border border-neutral-200 p-5 hover:border-primary-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-16 translate-x-16 group-hover:bg-primary-100 transition-colors duration-300" />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-600 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300 shadow-sm">
                          {getIcon(point.name)}
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                            priorityConfig.color
                          )}
                        >
                          <span className={cn('w-2 h-2 rounded-full', priorityConfig.dot)} />
                          {priorityConfig.label}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-neutral-800 mb-2 group-hover:text-primary-600 transition-colors">
                        {point.name}
                      </h3>

                      <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                        {point.description}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Target size={14} className="text-neutral-400 flex-shrink-0" />
                          <span className="text-neutral-500">目标系统：</span>
                          <span className="text-neutral-700 font-medium truncate">
                            {point.targetSystem}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle size={14} className="text-warning-500 flex-shrink-0" />
                          <span className="text-neutral-500">状态：</span>
                          <span className="px-2 py-0.5 bg-warning-100 text-warning-700 rounded text-xs font-medium">
                            待实现
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">
                            预计在后续版本中实现
                          </span>
                          <div className="flex -space-x-2">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-7 h-7 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-[10px] text-neutral-500 font-medium"
                              >
                                {['开', '发', '中'][i]}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-neutral-50 rounded-xl border border-neutral-200 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800 mb-1">说明</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                以上集成点的实现将按照优先级逐步推进。高优先级集成点将在近期版本中优先实现，
                以解决当前系统中的主要痛点。如有其他集成需求，请联系系统管理员进行评估。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
