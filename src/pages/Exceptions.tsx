import { useState, useEffect } from 'react';
import { useSurgeryStore } from '@/store/useSurgeryStore';
import {
  exceptionLevelLabels,
  exceptionLevelColors,
  exceptionStatusLabels,
  exceptionStatusColors,
  formatTime,
  statusLabels,
} from '@/utils/status';
import {
  AlertTriangle,
  Search,
  Filter,
  Clock,
  User,
  CheckCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Eye,
  Send,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';

const quickActions = [
  { label: '标记处理中', action: 'processing', icon: RotateCcw, color: 'amber' },
  { label: '标记已解决', action: 'resolved', icon: CheckCircle, color: 'green' },
  { label: '退回重提', action: 'return', icon: XCircle, color: 'red' },
];

export default function Exceptions() {
  const {
    exceptions,
    surgeries,
    resolveException,
    markExceptionProcessing,
    currentRole,
    selectSurgery,
  } = useSurgeryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const highlightId = searchParams.get('id');
    if (highlightId) {
      setExpandedId(highlightId);
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-exception-id="${highlightId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const filteredExceptions = exceptions.filter((e) => {
    const surgery = surgeries.find((s) => s.id === e.surgeryId);
    const matchesSearch =
      e.title.includes(searchQuery) ||
      e.description.includes(searchQuery) ||
      surgery?.patientName.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || e.level === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleResolve = () => {
    if (resolveModal && resolution.trim()) {
      resolveException(resolveModal, resolution);
      setResolveModal(null);
      setResolution('');
    }
  };

  const handleQuickAction = (exceptionId: string, action: string) => {
    if (action === 'resolved') {
      setResolveModal(exceptionId);
    } else if (action === 'processing') {
      markExceptionProcessing(exceptionId);
    } else if (action === 'return') {
      resolveException(exceptionId, '已退回，请相关人员重新核对后提交');
    }
  };

  const getSurgeryInfo = (surgeryId: string) => {
    return surgeries.find((s) => s.id === surgeryId);
  };

  const handleViewSurgery = (surgeryId: string) => {
    selectSurgery(surgeryId);
    navigate(`/surgeries?id=${surgeryId}`);
  };

  const pendingCount = exceptions.filter((e) => e.status === 'pending').length;
  const processingCount = exceptions.filter((e) => e.status === 'processing').length;
  const resolvedCount = exceptions.filter((e) => e.status === 'resolved').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">异常中心</h1>
        <p className="text-gray-500 mt-1">
          共 {exceptions.length} 条异常记录，{pendingCount} 条待处理
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">处理中</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{processingCount}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已解决</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{resolvedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索异常标题、描述、患者姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">全部等级</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">紧急</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredExceptions.map((exception) => {
            const surgery = getSurgeryInfo(exception.surgeryId);
            const isExpanded = expandedId === exception.id;

            return (
              <div
                key={exception.id}
                data-exception-id={exception.id}
                className={cn(
                  'transition-colors',
                  exception.status === 'pending' ? 'bg-red-50/30' : 'hover:bg-gray-50'
                )}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : exception.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          exception.level === 'critical'
                            ? 'bg-red-100'
                            : exception.level === 'high'
                            ? 'bg-orange-100'
                            : exception.level === 'medium'
                            ? 'bg-amber-100'
                            : 'bg-gray-100'
                        )}
                      >
                        <AlertTriangle
                          className={cn(
                            'w-5 h-5',
                            exception.level === 'critical'
                              ? 'text-red-600'
                              : exception.level === 'high'
                              ? 'text-orange-600'
                              : exception.level === 'medium'
                              ? 'text-amber-600'
                              : 'text-gray-600'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {exception.title}
                          </h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              exceptionLevelColors[exception.level]
                            )}
                          >
                            {exceptionLevelLabels[exception.level]}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              exceptionStatusColors[exception.status]
                            )}
                          >
                            {exceptionStatusLabels[exception.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {exception.description}
                        </p>
                        {surgery && (
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-gray-400">
                              患者: {surgery.patientName} · {surgery.surgeryType}
                            </p>
                            <span className="text-xs text-gray-400">
                              手术状态: {statusLabels[surgery.status]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {formatTime(exception.createdAt)}
                        </div>
                        {exception.handlerName && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <User className="w-3 h-3" />
                            {exception.handlerName}
                          </div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="ml-14 pt-4 border-t border-gray-100">
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          异常详情
                        </h4>
                        <p className="text-sm text-gray-600">{exception.description}</p>
                      </div>

                      {exception.resolution && (
                        <div className="bg-green-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <h4 className="text-sm font-medium text-green-700">
                              解决方案
                            </h4>
                          </div>
                          <p className="text-sm text-green-600">
                            {exception.resolution}
                          </p>
                          {exception.resolvedAt && (
                            <p className="text-xs text-green-500 mt-2">
                              解决时间: {formatTime(exception.resolvedAt)}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSurgery(exception.surgeryId);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          查看手术详情
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        {exception.status !== 'resolved' &&
                          (currentRole === 'admin' || currentRole === 'doctor') &&
                          quickActions.map((action) => (
                            <button
                              key={action.action}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction(exception.id, action.action);
                              }}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                                action.color === 'amber' &&
                                  'bg-amber-100 text-amber-700 hover:bg-amber-200',
                                action.color === 'green' &&
                                  'bg-green-100 text-green-700 hover:bg-green-200',
                                action.color === 'red' &&
                                  'bg-red-100 text-red-700 hover:bg-red-200'
                              )}
                            >
                              <action.icon className="w-4 h-4" />
                              {action.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredExceptions.length === 0 && (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">暂无匹配的异常记录</p>
            </div>
          )}
        </div>
      </div>

      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">标记异常已解决</h3>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="请输入解决方案..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setResolveModal(null);
                  setResolution('');
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
