import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Car,
  Phone,
  FileText,
  Wrench,
  ShieldAlert,
  AlertTriangle,
  History,
  Paperclip,
  CircleDollarSign,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import StatusBadge from '@/components/StatusBadge';
import StatusTimeline from '@/components/StatusTimeline';
import type { Order, StatusHistoryItem } from '@shared/types';
import { ROLE_LABEL } from '@shared/types';

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 bg-carbon-100 border-2 border-carbon-200 flex items-center justify-center shrink-0">
        <Icon size={16} strokeWidth={2} className="text-carbon-600" />
      </div>
      <div>
        <div className="label-text">{label}</div>
        <div className="font-mono text-sm text-carbon-800">{value}</div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    (async () => {
      setLoading(true);
      const [oRes, hRes] = await Promise.all([api.getOrder(id), api.getOrderHistory(id)]);
      if (oRes.code === 0 && oRes.data) setOrder(oRes.data as unknown as Order);
      if (hRes.code === 0 && hRes.data) setHistory(hRes.data as unknown as StatusHistoryItem[]);
      setLoading(false);
    })();
  }, [id, user, navigate]);

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="font-mono text-sm text-carbon-500 uppercase tracking-wider animate-pulse">
          加载工单详情...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 border-2 border-carbon-300 flex items-center justify-center hover:border-ochre-700 hover:text-ochre-800 transition-colors"
            title="返回列表（保留筛选）"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-carbon-400">
                ORDER DETAIL
              </p>
              <StatusBadge status={order.status} />
              {order.isException && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 border-2 border-red-300 font-mono text-xs uppercase tracking-wider text-red-700">
                  <AlertTriangle size={12} strokeWidth={2} />
                  {order.exceptionReason || '异常'}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl tracking-wider text-carbon-800 leading-none mt-1">
              工单 {order.orderNo}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          {user?.role === 'TECHNICIAN' &&
            (order.status === 'PENDING_SELECTION' || order.status === 'QUOTE_REJECTED') && (
              <Link to={`/orders/${order.id}/selection`} className="btn-primary">
                <Wrench size={16} strokeWidth={2} className="mr-2" />
                {order.status === 'QUOTE_REJECTED' ? '重新选型' : '去选型'}
              </Link>
            )}
          {user?.role === 'TECHNICIAN' && order.status === 'IN_SELECTION' && (
            <Link to={`/orders/${order.id}/selection`} className="btn-primary">
              <Wrench size={16} strokeWidth={2} className="mr-2" />
              继续选型
            </Link>
          )}
          {user?.role === 'MANAGER' && order.status === 'PENDING_QUOTE' && (
            <Link to={`/orders/${order.id}/quote`} className="btn-gold">
              <ShieldAlert size={16} strokeWidth={2} className="mr-2" />
              审核报价
            </Link>
          )}
          {(order.status === 'PENDING_QUOTE' ||
            order.status === 'QUOTE_CONFIRMED' ||
            order.status === 'QUOTE_REJECTED') && (
            <Link to={`/orders/${order.id}/quote`} className="btn-secondary">
              <CircleDollarSign size={16} strokeWidth={2} className="mr-2" />
              报价回看
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-accent p-6">
            <h2 className="section-title">客户与车辆信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoItem icon={User} label="客户姓名" value={order.customerName} />
              <InfoItem icon={Phone} label="联系电话" value={order.phone} />
              <InfoItem icon={Car} label="车牌号码" value={order.vehiclePlate} />
              <InfoItem icon={Car} label="车辆型号" value={order.vehicleModel} />
            </div>
            {order.remark && (
              <div className="mt-5 pt-5 border-t border-carbon-100">
                <InfoItem icon={FileText} label="备注信息" value={order.remark} />
              </div>
            )}
          </div>

          <div
            className={`p-6 border-2 ${
              order.selectionResponsible
                ? 'border-ochre-400 bg-ochre-50'
                : 'border-dashed border-carbon-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-ochre-700 flex items-center justify-center text-white">
                <Wrench size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-display text-2xl tracking-wider text-carbon-800">
                  轮胎选型责任
                </h3>
                <p className="font-mono text-xs text-carbon-500 uppercase tracking-wider">
                  TIRE SELECTION RESPONSIBILITY · 技师专属
                </p>
              </div>
            </div>
            {order.selectionResponsible ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border-2 border-ochre-300">
                  <div className="label-text">责任人</div>
                  <div className="font-mono text-base font-semibold text-ochre-800">
                    {order.selectionResponsibleName}
                    <span className="ml-2 text-xs font-normal text-ochre-600 uppercase tracking-wider">
                      [{ROLE_LABEL.TECHNICIAN}]
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white border-2 border-ochre-300">
                  <div className="label-text">选型状态</div>
                  <div className="font-mono text-sm">
                    {order.tireSpecs.length > 0 ? (
                      <span className="text-ochre-800">
                        已选 {order.tireSpecs.length} 款轮胎
                      </span>
                    ) : (
                      <span className="text-carbon-400">选型进行中...</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-ochre-300 bg-white">
                <p className="font-mono text-sm text-ochre-700 uppercase tracking-wider">
                  责任待分配 · 等待技师领取工单
                </p>
                <p className="font-mono text-xs text-carbon-400 mt-2">
                  非技师角色不可操作此环节
                </p>
              </div>
            )}
            {order.tireSpecs.length > 0 && (
              <div className="mt-5 overflow-hidden border-2 border-carbon-200">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">品牌</th>
                      <th className="table-header">规格</th>
                      <th className="table-header">载重/速度</th>
                      <th className="table-header text-right">单价</th>
                      <th className="table-header text-right">数量</th>
                      <th className="table-header text-right">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.tireSpecs.map((ts) => (
                      <tr key={ts.id} className="hover:bg-carbon-50">
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
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {order.tireSpecs.length > 0 && !order.quoteResponsible && order.status === 'PENDING_QUOTE' && (
            <div className="p-4 border-2 border-red-500 bg-red-50 flex items-start gap-3 animate-slide-up">
              <AlertTriangle size={22} strokeWidth={2.5} className="text-red-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-sm font-bold text-red-800 uppercase tracking-wider mb-1">
                  责任分界预警 · 选型已提交，报价待确认
                </div>
                <div className="font-mono text-xs text-red-700 leading-relaxed">
                  此环节以上「轮胎规格、品牌、数量」由<b>技师 {order.selectionResponsibleName || '(未分配)'}</b> 负技术责任；
                  此环节以下「报价金额、优惠折扣、最终应收」由<b>店长</b>负商务责任。
                  两个环节责任独立，不可跨角色操作。
                </div>
              </div>
            </div>
          )}

          <div
            className={`p-6 border-2 ${
              order.quoteResponsible
                ? 'border-carbon-600 bg-carbon-50'
                : 'border-dashed border-carbon-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-carbon-800 flex items-center justify-center text-white">
                <ShieldAlert size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-display text-2xl tracking-wider text-carbon-800">
                  报价确认责任
                </h3>
                <p className="font-mono text-xs text-carbon-500 uppercase tracking-wider">
                  QUOTE CONFIRMATION RESPONSIBILITY · 店长专属
                </p>
              </div>
            </div>
            {order.quote ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="p-4 bg-white border-2 border-carbon-300">
                    <div className="label-text">报价审核人</div>
                    <div className="font-mono text-base font-semibold text-carbon-800">
                      {order.quoteResponsibleName || (
                        <span className="text-carbon-400 font-normal">— 待店长确认 —</span>
                      )}
                      {order.quoteResponsibleName && (
                        <span className="ml-2 text-xs font-normal text-carbon-500 uppercase tracking-wider">
                          [{ROLE_LABEL.MANAGER}]
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-white border-2 border-carbon-300">
                    <div className="label-text">报价合计</div>
                    <div className="font-mono text-2xl font-bold text-carbon-800">
                      ¥{order.quote.total.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 p-4 bg-white border-2 border-carbon-200">
                  <div>
                    <div className="label-text">轮胎小计</div>
                    <div className="font-mono text-sm text-carbon-700">
                      ¥{order.quote.subtotal.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="label-text">工时费</div>
                    <div className="font-mono text-sm text-carbon-700">
                      ¥{order.quote.laborFee.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="label-text">优惠</div>
                    <div className="font-mono text-sm text-green-700">
                      -¥{order.quote.discount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="label-text">应收总额</div>
                    <div className="font-mono text-lg font-bold text-ochre-800">
                      ¥{order.quote.total.toLocaleString()}
                    </div>
                  </div>
                </div>
                {order.rejectReason && (
                  <div className="mt-5 p-4 border-2 border-red-300 bg-red-50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} strokeWidth={2} className="text-red-700" />
                      <span className="font-mono text-xs uppercase tracking-wider text-red-700 font-semibold">
                        驳回原因
                      </span>
                    </div>
                    <p className="font-mono text-sm text-red-800">{order.rejectReason}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-carbon-300">
                <p className="font-mono text-sm text-carbon-500 uppercase tracking-wider">
                  报价待生成 · 先完成轮胎选型
                </p>
                <p className="font-mono text-xs text-carbon-400 mt-2">
                  选型提交后自动流转至报价环节
                </p>
              </div>
            )}
          </div>

          {order.basisMaterials.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Paperclip size={20} strokeWidth={2} className="text-carbon-600" />
                <h3 className="font-display text-2xl tracking-wider text-carbon-800">
                  背景材料（旧台账/现场记录/沟通截图）
                </h3>
              </div>
              <ul className="space-y-2">
                {order.basisMaterials.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 p-3 bg-carbon-50 border-2 border-carbon-100 font-mono text-sm text-carbon-700"
                  >
                    <span className="w-6 h-6 bg-brass-500 text-white flex items-center justify-center font-mono text-xs">
                      {i + 1}
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <History size={20} strokeWidth={2} className="text-carbon-600" />
              <h3 className="font-display text-2xl tracking-wider text-carbon-800">
                状态流转记录
              </h3>
            </div>
            <StatusTimeline history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}
