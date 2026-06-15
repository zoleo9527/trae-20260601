import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Wrench,
  User,
  Car,
  Save,
  History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import StatusBadge from '@/components/StatusBadge';
import StatusTimeline from '@/components/StatusTimeline';
import type { Order, StatusHistoryItem } from '@shared/types';
import { ROLE_LABEL, ERROR_CODES } from '@shared/types';

export default function QuoteConfirm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isReview = user?.role === 'MANAGER' && order?.status === 'PENDING_QUOTE';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    (async () => {
      setLoading(true);
      const res = await api.getQuoteDetail(id);
      if (res.code === 0 && res.data) {
        const d = res.data as { order: Order; history: StatusHistoryItem[] };
        setOrder(d.order);
        setHistory(d.history);
      } else {
        setError(res.message);
      }
      setLoading(false);
    })();
  }, [id, user, navigate]);

  const handleAction = async (action: 'confirm' | 'reject') => {
    if (!id) return;
    if (action === 'reject' && !rejectReason.trim()) {
      setError('请填写驳回原因');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await api.processQuote(id, {
      action,
      rejectReason: action === 'reject' ? rejectReason.trim() : undefined,
    });
    setSubmitting(false);
    if (res.code === ERROR_CODES.SUCCESS) {
      navigate(`/orders/${id}`);
    } else {
      setError(res.message);
    }
  };

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="font-mono text-sm text-carbon-500 uppercase tracking-wider animate-pulse">
          加载报价信息...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/orders/${order.id}`}
            className="w-10 h-10 border-2 border-carbon-300 flex items-center justify-center hover:border-carbon-700 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-carbon-400">
                QUOTE {isReview ? 'CONFIRMATION · 店长审核' : 'REVIEW · 报价回看'}
              </p>
              <StatusBadge status={order.status} />
            </div>
            <h1 className="font-display text-4xl tracking-wider text-carbon-800 leading-none mt-1">
              {isReview ? '报价审核确认' : '报价回看'} · {order.orderNo}
            </h1>
          </div>
        </div>
        {isReview && (
          <div className="flex items-center gap-2 px-4 py-2 bg-carbon-900 text-white">
            <ShieldAlert size={18} strokeWidth={2} />
            <span className="font-mono text-sm uppercase tracking-wider">
              店长 {user?.name} · 报价确认责任人
            </span>
          </div>
        )}
      </header>

      {error && (
        <div className="p-4 border-2 border-red-400 bg-red-50 flex items-start gap-3">
          <AlertTriangle size={20} strokeWidth={2} className="text-red-700 shrink-0 mt-0.5" />
          <div className="font-mono text-sm text-red-800">{error}</div>
        </div>
      )}

      {!order.quote && (
        <div className="p-8 border-2 border-dashed border-carbon-300 bg-white text-center">
          <p className="font-mono text-sm text-carbon-500 uppercase tracking-wider">
            报价尚未生成，请先完成轮胎选型
          </p>
          <Link to={`/orders/${order.id}`} className="btn-secondary mt-4 inline-flex">
            返回工单详情
          </Link>
        </div>
      )}

      {order.quote && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className={`p-6 border-2 ${
                isReview
                  ? 'border-carbon-700 bg-carbon-50'
                  : order.status === 'QUOTE_CONFIRMED'
                  ? 'border-green-600 bg-green-50'
                  : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 flex items-center justify-center text-white ${
                    isReview
                      ? 'bg-carbon-800'
                      : order.status === 'QUOTE_CONFIRMED'
                      ? 'bg-green-700'
                      : 'bg-red-700'
                  }`}
                >
                  {order.status === 'QUOTE_CONFIRMED' ? (
                    <CheckCircle2 size={24} strokeWidth={2} />
                  ) : order.status === 'QUOTE_REJECTED' ? (
                    <XCircle size={24} strokeWidth={2} />
                  ) : (
                    <ShieldAlert size={24} strokeWidth={2} />
                  )}
                </div>
                <div>
                  <h2 className="font-display text-3xl tracking-wider text-carbon-800">
                    {order.status === 'QUOTE_CONFIRMED'
                      ? '报价已确认'
                      : order.status === 'QUOTE_REJECTED'
                      ? '报价已驳回'
                      : '报价待确认'}
                  </h2>
                  <p className="font-mono text-xs text-carbon-500 uppercase tracking-wider mt-1">
                    {isReview
                      ? '请店长仔细审核选型规格与金额，确认后将生效'
                      : order.status === 'QUOTE_CONFIRMED'
                      ? '此报价已由店长确认，可作为结算依据'
                      : '此报价已被驳回，请查看驳回原因并联系技师重新选型'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white border-2 border-carbon-200">
                  <div className="label-text">轮胎小计</div>
                  <div className="font-mono text-xl font-bold text-carbon-800">
                    ¥{order.quote.subtotal.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-white border-2 border-carbon-200">
                  <div className="label-text">工时费</div>
                  <div className="font-mono text-xl font-bold text-carbon-800">
                    ¥{order.quote.laborFee.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-white border-2 border-carbon-200">
                  <div className="label-text">优惠</div>
                  <div className="font-mono text-xl font-bold text-green-700">
                    -¥{order.quote.discount.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-ochre-50 border-2 border-ochre-400">
                  <div className="label-text text-ochre-700">应收合计</div>
                  <div className="font-mono text-2xl font-bold text-ochre-800">
                    ¥{order.quote.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText size={20} strokeWidth={2} className="text-ochre-700" />
                <h2 className="section-title mb-0">轮胎选型明细</h2>
              </div>
              <div className="overflow-hidden border-2 border-carbon-200">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">#</th>
                      <th className="table-header">品牌</th>
                      <th className="table-header">规格</th>
                      <th className="table-header">载重/速度</th>
                      <th className="table-header text-right">单价</th>
                      <th className="table-header text-right">数量</th>
                      <th className="table-header text-right">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.tireSpecs.map((ts, idx) => (
                      <tr key={ts.id} className="hover:bg-carbon-50">
                        <td className="table-cell">{idx + 1}</td>
                        <td className="table-cell font-semibold">{ts.brand}</td>
                        <td className="table-cell">{ts.size}</td>
                        <td className="table-cell">
                          {ts.loadIndex}/{ts.speedRating}
                        </td>
                        <td className="table-cell text-right font-mono">
                          ¥{ts.unitPrice.toLocaleString()}
                        </td>
                        <td className="table-cell text-right">{ts.quantity}</td>
                        <td className="table-cell text-right font-semibold text-ochre-800">
                          ¥{(ts.unitPrice * ts.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-carbon-50 border-t-2 border-carbon-300">
                      <td colSpan={6} className="table-cell text-right font-semibold">
                        轮胎小计
                      </td>
                      <td className="table-cell text-right font-bold text-carbon-800">
                        ¥{order.quote.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6 border-l-4 border-ochre-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-ochre-700 flex items-center justify-center text-white">
                    <Wrench size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl tracking-wider text-carbon-800">
                      选型责任
                    </h3>
                    <p className="font-mono text-[10px] text-carbon-500 uppercase tracking-widest">
                      SELECTION RESPONSIBILITY
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-ochre-50 border-2 border-ochre-200">
                  <div className="font-mono text-base font-semibold text-ochre-800">
                    {order.selectionResponsibleName || '— 未分配 —'}
                  </div>
                  <div className="font-mono text-xs text-ochre-600 uppercase tracking-wider mt-1">
                    [{ROLE_LABEL.TECHNICIAN}]
                  </div>
                </div>
                <p className="font-mono text-xs text-carbon-500 mt-3">
                  选型规格、品牌、数量由技师负责，报价确认不对选型内容做技术担保
                </p>
              </div>

              <div className="card p-6 border-l-4 border-carbon-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-carbon-800 flex items-center justify-center text-white">
                    <ShieldAlert size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl tracking-wider text-carbon-800">
                      报价确认责任
                    </h3>
                    <p className="font-mono text-[10px] text-carbon-500 uppercase tracking-widest">
                      QUOTE RESPONSIBILITY
                    </p>
                  </div>
                </div>
                <div
                  className={`p-3 border-2 ${
                    order.quoteResponsibleName
                      ? 'bg-carbon-100 border-carbon-300'
                      : 'bg-white border-dashed border-carbon-300'
                  }`}
                >
                  <div className="font-mono text-base font-semibold text-carbon-800">
                    {order.quoteResponsibleName || '— 待确认 —'}
                  </div>
                  <div className="font-mono text-xs text-carbon-500 uppercase tracking-wider mt-1">
                    [{ROLE_LABEL.MANAGER}]
                  </div>
                </div>
                <p className="font-mono text-xs text-carbon-500 mt-3">
                  报价金额、优惠折扣、最终应收由店长确认，确认后不可撤回
                </p>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <User size={20} strokeWidth={2} className="text-carbon-600" />
                <h2 className="section-title mb-0">客户与车辆</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="label-text">客户姓名</div>
                  <div className="font-mono text-sm font-semibold text-carbon-800">
                    {order.customerName}
                  </div>
                </div>
                <div>
                  <div className="label-text">联系电话</div>
                  <div className="font-mono text-sm text-carbon-700">{order.phone}</div>
                </div>
                <div>
                  <div className="label-text">车牌号码</div>
                  <div className="font-mono text-sm font-semibold text-carbon-800">
                    {order.vehiclePlate}
                  </div>
                </div>
                <div>
                  <div className="label-text flex items-center gap-1">
                    <Car size={12} strokeWidth={2} /> 车型
                  </div>
                  <div className="font-mono text-sm text-carbon-700">{order.vehicleModel}</div>
                </div>
              </div>
            </div>

            {isReview && showReject && (
              <div className="p-6 border-2 border-red-400 bg-red-50 animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={18} strokeWidth={2} className="text-red-700" />
                  <h3 className="font-mono text-sm font-semibold text-red-800 uppercase tracking-wider">
                    驳回原因（必填）
                  </h3>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="请详细描述驳回原因，如：选型品牌不符合客户要求、价格异常、规格错误等..."
                  className="input-field resize-none"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowReject(false)} className="btn-secondary">
                    取消驳回
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={submitting || !rejectReason.trim()}
                    className="btn-danger disabled:opacity-50"
                  >
                    <XCircle size={16} strokeWidth={2} className="mr-2" />
                    {submitting ? '提交中...' : '确认驳回，退回选型'}
                  </button>
                </div>
              </div>
            )}

            {order.rejectReason && order.status === 'QUOTE_REJECTED' && (
              <div className="p-5 border-2 border-red-400 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} strokeWidth={2} className="text-red-700" />
                  <span className="font-mono text-xs uppercase tracking-wider text-red-700 font-semibold">
                    驳回原因
                  </span>
                </div>
                <p className="font-mono text-sm text-red-900">{order.rejectReason}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-4">
                <History size={20} strokeWidth={2} className="text-carbon-600" />
                <h3 className="font-display text-2xl tracking-wider text-carbon-800">
                  流转记录
                </h3>
              </div>
              <StatusTimeline history={history} />

              {isReview && !showReject && (
                <div className="mt-6 pt-6 border-t-2 border-carbon-200 space-y-3">
                  <button
                    onClick={() => handleAction('confirm')}
                    disabled={submitting}
                    className="w-full btn-gold disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} strokeWidth={2} className="mr-2" />
                    {submitting ? '确认中...' : `确认报价 ¥${order.quote?.total.toLocaleString()}`}
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    disabled={submitting}
                    className="w-full btn-danger"
                  >
                    <XCircle size={18} strokeWidth={2} className="mr-2" />
                    驳回，退回选型
                  </button>
                </div>
              )}

              {!isReview && (
                <div className="mt-6 pt-6 border-t-2 border-carbon-200">
                  <Link to={`/orders/${order.id}`} className="w-full btn-secondary flex justify-center">
                    <Save size={16} strokeWidth={2} className="mr-2" />
                    返回工单详情
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
