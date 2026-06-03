import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Palette,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { RemarkChain } from '@/components/RemarkChain';
import { StatusTimeline } from '@/components/StatusTimeline';
import { cn } from '@/lib/utils';

export default function QualityCheck() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    initMockData,
    getOrderById,
    getRemarksByOrderId,
    getAuditLogs,
    qualityCheck,
    currentUser,
    currentRole,
    setCurrentRole,
    setCurrentUser,
  } = useAppStore();

  const [qualityResult, setQualityResult] = useState<'pass' | 'fail' | ''>('');
  const [reworkReason, setReworkReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const order = id ? getOrderById(id) : undefined;
  const remarks = order ? getRemarksByOrderId(order.id) : [];
  const auditLogs = order
    ? getAuditLogs({ page: 1, pageSize: 100, orderId: order.id }).data
    : [];

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('QUALITY');
    }
    if (!currentUser) {
      setCurrentUser('质检小张');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBack = () => {
    navigate('/quality');
  };

  const handleSubmit = async () => {
    if (!order || !qualityResult) return;
    if (qualityResult === 'fail' && !reworkReason.trim()) return;

    setIsSubmitting(true);
    try {
      qualityCheck(
        order.id,
        qualityResult === 'pass',
        qualityResult === 'fail' ? reworkReason.trim() : '',
        currentUser || '质检小张'
      );

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/quality');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500">未找到订单信息</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            返回工作台
          </button>
        </div>
      </div>
    );
  }

  const isPendingInspection = order.status === 'PENDING_INSPECTION';

  return (
    <div className="min-h-screen bg-neutral-50">
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center animate-slide-in max-w-sm">
            <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-success-500" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              {qualityResult === 'pass' ? '质检通过' : '已发起返工'}
            </h3>
            <p className="text-neutral-500">
              {qualityResult === 'pass'
                ? '订单已完成，正在跳转...'
                : '返工流程已启动，正在跳转...'}
            </p>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-neutral-600" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">质检处理</h1>
                <p className="text-xs text-neutral-500">订单号：{order.orderNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={order.status} />
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{currentUser || '未登录'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-transparent">
                <h3 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
                  <FileText size={18} className="text-primary-600" />
                  订单基本信息
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">订单号</p>
                    <p className="text-base font-semibold text-primary-600">{order.orderNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">客户姓名</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                        <User size={12} className="text-primary-600" />
                      </div>
                      <p className="text-base font-medium text-neutral-800">{order.customerName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">义齿类型</p>
                    <div className="flex items-center gap-2">
                      <Palette size={14} className="text-primary-500" />
                      <p className="text-base font-medium text-neutral-800">{order.toothType}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">色号</p>
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-medium text-sm">
                      {order.shade}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">交付日期</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-warning-500" />
                      <p className="text-base font-medium text-neutral-800">{order.deliveryDate}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">创建时间</p>
                    <p className="text-sm font-medium text-neutral-700">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">创建人</p>
                    <p className="text-sm font-medium text-neutral-700">{order.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">返工次数</p>
                    {order.reworkCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-danger-100 text-danger-700 text-sm font-medium">
                        <RotateCcw size={12} />
                        {order.reworkCount} 次
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-sm">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {auditLogs.length > 0 && (
              <StatusTimeline logs={auditLogs} currentStatus={order.status} />
            )}

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-success-50 to-transparent">
                <h3 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
                  <FileText size={18} className="text-success-600" />
                  完整备注链
                  <span className="text-xs font-normal text-neutral-500">
                    （客服、设计师、派单所有备注）
                  </span>
                </h3>
              </div>
              <div className="p-5">
                <RemarkChain
                  remarks={remarks}
                  currentRole={null}
                  currentUser=""
                  maxVisible={10}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-primary-200 shadow-sm overflow-hidden sticky top-24">
              <div className="p-4 border-b border-primary-100 bg-gradient-to-r from-primary-500 to-primary-600">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  质检结果
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  请仔细检查后确认质检结果
                </p>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    质检结果 <span className="text-danger-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setQualityResult('pass')}
                      disabled={!isPendingInspection}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                        qualityResult === 'pass'
                          ? 'border-success-500 bg-success-50'
                          : 'border-neutral-200 hover:border-success-300 hover:bg-success-50/50',
                        !isPendingInspection && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                          qualityResult === 'pass'
                            ? 'bg-success-500 text-white'
                            : 'bg-success-100 text-success-600'
                        )}
                      >
                        <CheckCircle2 size={24} />
                      </div>
                      <span
                        className={cn(
                          'font-medium text-sm',
                          qualityResult === 'pass' ? 'text-success-700' : 'text-neutral-700'
                        )}
                      >
                        合格
                      </span>
                    </button>

                    <button
                      onClick={() => setQualityResult('fail')}
                      disabled={!isPendingInspection}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                        qualityResult === 'fail'
                          ? 'border-danger-500 bg-danger-50'
                          : 'border-neutral-200 hover:border-danger-300 hover:bg-danger-50/50',
                        !isPendingInspection && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                          qualityResult === 'fail'
                            ? 'bg-danger-500 text-white'
                            : 'bg-danger-100 text-danger-600'
                        )}
                      >
                        <XCircle size={24} />
                      </div>
                      <span
                        className={cn(
                          'font-medium text-sm',
                          qualityResult === 'fail' ? 'text-danger-700' : 'text-neutral-700'
                        )}
                      >
                        不合格
                      </span>
                    </button>
                  </div>
                </div>

                {qualityResult === 'fail' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      返工原因 <span className="text-danger-500">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        value={reworkReason}
                        onChange={(e) => setReworkReason(e.target.value)}
                        placeholder="请详细描述不合格原因及返工要求..."
                        rows={5}
                        className="w-full px-4 py-3 border border-danger-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 transition-all resize-none"
                        maxLength={500}
                        disabled={!isPendingInspection}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-neutral-400">
                          {reworkReason.length} / 500 字
                        </span>
                        <p className="text-xs text-danger-500">
                          提交后将自动回退至设计师环节
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {qualityResult === 'pass' && (
                  <div className="p-4 bg-success-50 border border-success-200 rounded-lg animate-fade-in">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-success-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-success-800">质检通过</p>
                        <p className="text-xs text-success-600 mt-1">
                          提交后订单状态将变更为"已完成"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!isPendingInspection && (
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-neutral-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-700">当前订单无需质检</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          该订单当前状态为：{order.status}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleBack}
                      className="w-full px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                    >
                      返回列表
                    </button>
                    {isPendingInspection && (
                      <button
                        onClick={handleSubmit}
                        disabled={
                          !qualityResult ||
                          (qualityResult === 'fail' && !reworkReason.trim()) ||
                          isSubmitting
                        }
                        className={cn(
                          'flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg font-medium transition-colors shadow-sm',
                          qualityResult === 'pass'
                            ? 'bg-success-500 text-white hover:bg-success-600'
                            : 'bg-danger-500 text-white hover:bg-danger-600',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        <Send size={16} />
                        {isSubmitting
                          ? '提交中...'
                          : qualityResult === 'pass'
                          ? '确认合格'
                          : '确认返工'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
