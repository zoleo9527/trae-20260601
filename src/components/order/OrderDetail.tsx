import { WorkOrder } from '../../types';
import { clsx } from 'clsx';
import {
  FileText,
  Car,
  Circle,
  Wrench,
  AlertTriangle,
  History,
  User,
  Clock,
  ChevronRight,
  Send,
  Play,
  Pause,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useDispatchStore } from '../../store/dispatchStore';
import { useTechnicianStore } from '../../store/technicianStore';
import { useWorkOrderStore } from '../../store/workOrderStore';
import { useState } from 'react';

interface OrderDetailProps {
  order: WorkOrder;
}

const statusConfig = {
  pending: { label: '待处理', color: 'text-[#f39c12]', bg: 'bg-[#f39c12]/10' },
  dispatched: { label: '已派工', color: 'text-[#0f3460]', bg: 'bg-[#0f3460]/10' },
  in_progress: { label: '进行中', color: 'text-[#3498db]', bg: 'bg-[#3498db]/10' },
  completed: { label: '已完成', color: 'text-[#27ae60]', bg: 'bg-[#27ae60]/10' },
  suspended: { label: '已暂停', color: 'text-[#e94560]', bg: 'bg-[#e94560]/10' },
  cancelled: { label: '已取消', color: 'text-[#a0a0a0]', bg: 'bg-[#a0a0a0]/10' },
};

const priorityConfig = {
  urgent: { label: '紧急', color: 'text-[#e94560]' },
  high: { label: '高优', color: 'text-[#f39c12]' },
  normal: { label: '普通', color: 'text-[#0f3460]' },
  low: { label: '低优', color: 'text-[#a0a0a0]' },
};

const exceptionTypeLabels = {
  wrong_model: '型号拿错',
  warranty_dispute: '补胎争议',
  inventory_issue: '库存批次问题',
  other: '其他异常',
};

const exceptionStatusLabels = {
  open: '待处理',
  analyzing: '分析中',
  handling: '处理中',
  resolved: '已解决',
  escalated: '已升级',
  closed: '已关闭',
};

export default function OrderDetail({ order }: OrderDetailProps) {
  const { dispatches } = useDispatchStore();
  const { getTechnicianById } = useTechnicianStore();
  const { updateOrder } = useWorkOrderStore();
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const status = statusConfig[order.status];
  const priority = priorityConfig[order.priority];

  const orderDispatches = dispatches.filter(d => d.workOrderId === order.id);
  const hasTechnician = !!order.installation.technicianId;
  const isPending = order.status === 'pending';
  const isInProgress = order.status === 'in_progress';
  const isSuspended = order.status === 'suspended';

  const handleDispatch = () => {
    setShowDispatchModal(true);
  };

  const handleReportException = () => {
    setShowExceptionModal(true);
  };

  const handlePause = () => {
    updateOrder(order.id, { status: 'suspended' });
  };

  const handleResume = () => {
    updateOrder(order.id, { status: 'in_progress' });
  };

  const handleComplete = () => {
    updateOrder(order.id, { status: 'completed' });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 pb-32">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#eaeaea] mb-1">
              {order.orderNo}
            </h2>
            <p className="text-sm text-[#a0a0a0]">
              创建于 {format(order.createdAt, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={clsx('px-3 py-1 text-sm font-medium rounded-full', status.bg, status.color)}>
              {status.label}
            </span>
            <span className={clsx('px-3 py-1 text-sm font-medium', priority.color)}>
              {priority.label}
            </span>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-[#0f3460]" />
            <h3 className="text-sm font-semibold text-[#eaeaea]">基本信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#a0a0a0] mb-1">来源渠道</p>
              <p className="text-[#eaeaea]">{order.source}</p>
            </div>
            <div>
              <p className="text-[#a0a0a0] mb-1">紧急程度</p>
              <p className={priority.color}>{priority.label}</p>
            </div>
            <div>
              <p className="text-[#a0a0a0] mb-1">最后更新</p>
              <p className="text-[#eaeaea]">
                {format(order.updatedAt, 'HH:mm:ss', { locale: zhCN })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-2 mb-3">
            <Car size={18} className="text-[#0f3460]" />
            <h3 className="text-sm font-semibold text-[#eaeaea]">车辆信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#a0a0a0] mb-1">车牌号</p>
              <p className="text-[#eaeaea] font-mono">{order.vehicle.plateNo}</p>
            </div>
            <div>
              <p className="text-[#a0a0a0] mb-1">品牌车型</p>
              <p className="text-[#eaeaea]">
                {order.vehicle.brand} {order.vehicle.model}
              </p>
            </div>
            <div>
              <p className="text-[#a0a0a0] mb-1">年款</p>
              <p className="text-[#eaeaea]">{order.vehicle.year}</p>
            </div>
            <div>
              <p className="text-[#a0a0a0] mb-1">VIN码</p>
              <p className="text-[#eaeaea] font-mono text-xs">
                {order.vehicle.vin}
              </p>
            </div>
            <div>
              <p className="text-[#a0a0a0] mb-1">行驶里程</p>
              <p className="text-[#eaeaea]">{order.vehicle.mileage.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-2 mb-3">
            <Circle size={18} className="text-[#0f3460]" />
            <h3 className="text-sm font-semibold text-[#eaeaea]">轮胎信息</h3>
          </div>
          <div className="space-y-3">
            {order.tires.map((tire, index) => (
              <div key={index} className="bg-[#1a1a2e] rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#eaeaea]">
                    {tire.brand} {tire.model}
                  </span>
                  <span className="text-xs text-[#a0a0a0]">× {tire.quantity}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#a0a0a0]">规格:</span>
                    <span className="text-[#eaeaea] ml-1">{tire.spec}</span>
                  </div>
                  <div>
                    <span className="text-[#a0a0a0]">花纹:</span>
                    <span className="text-[#eaeaea] ml-1">{tire.pattern || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#a0a0a0]">单价:</span>
                    <span className="text-[#eaeaea] ml-1">¥{tire.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {orderDispatches.length > 0 && (
          <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="text-[#0f3460]" />
              <h3 className="text-sm font-semibold text-[#eaeaea]">派工历史</h3>
              <span className="ml-auto px-2 py-0.5 bg-[#0f3460]/10 text-[#0f3460] text-xs rounded-full">
                {orderDispatches.length} 次
              </span>
            </div>
            <div className="space-y-3">
              {orderDispatches.map((dispatch) => {
                const tech = getTechnicianById(dispatch.technicianId);
                return (
                  <div key={dispatch.id} className="bg-[#1a1a2e] rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#eaeaea]">
                          {tech?.name || dispatch.technicianId}
                        </span>
                        <span className="text-xs text-[#a0a0a0]">
                          {dispatch.dispatchType === 'auto' ? '自动派工' : '手动派工'}
                        </span>
                      </div>
                      <span className="text-xs text-[#a0a0a0]">
                        {format(dispatch.dispatchedAt, 'MM/dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-[#a0a0a0]" />
                        <span className="text-[#a0a0a0]">
                          派工时间: {format(dispatch.dispatchedAt, 'HH:mm', { locale: zhCN })}
                        </span>
                        {dispatch.confirmedAt && (
                          <span className="text-[#a0a0a0]">
                            → 确认: {format(dispatch.confirmedAt, 'HH:mm', { locale: zhCN })}
                          </span>
                        )}
                        {dispatch.completedAt && (
                          <span className="text-[#a0a0a0]">
                            → 完成: {format(dispatch.completedAt, 'HH:mm', { locale: zhCN })}
                          </span>
                        )}
                      </div>
                      {dispatch.notes && (
                        <div className="text-[#a0a0a0]">
                          备注: {dispatch.notes}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'px-2 py-0.5 text-xs rounded',
                            {
                              pending: 'bg-[#f39c12]/10 text-[#f39c12]',
                              confirmed: 'bg-[#3498db]/10 text-[#3498db]',
                              in_progress: 'bg-[#3498db]/10 text-[#3498db]',
                              completed: 'bg-[#27ae60]/10 text-[#27ae60]',
                              cancelled: 'bg-[#a0a0a0]/10 text-[#a0a0a0]',
                            }[dispatch.status]
                          )}
                        >
                          {
                            {
                              pending: '待确认',
                              confirmed: '已确认',
                              in_progress: '进行中',
                              completed: '已完成',
                              cancelled: '已取消',
                            }[dispatch.status]
                          }
                        </span>
                        {dispatch.result && (
                          <span className="text-[#a0a0a0]">
                            结果: {dispatch.result === 'success' ? '成功' : dispatch.result}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.installation.technicianId && (
          <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={18} className="text-[#0f3460]" />
              <h3 className="text-sm font-semibold text-[#eaeaea]">安装信息</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#a0a0a0] mb-1">技师</p>
                <p className="text-[#eaeaea]">
                  {getTechnicianById(order.installation.technicianId)?.name || order.installation.technicianId}
                </p>
              </div>
              {order.installation.startTime && (
                <div>
                  <p className="text-[#a0a0a0] mb-1">开始时间</p>
                  <p className="text-[#eaeaea]">
                    {format(order.installation.startTime, 'HH:mm', { locale: zhCN })}
                  </p>
                </div>
              )}
              {order.installation.endTime && (
                <div>
                  <p className="text-[#a0a0a0] mb-1">结束时间</p>
                  <p className="text-[#eaeaea]">
                    {format(order.installation.endTime, 'HH:mm', { locale: zhCN })}
                  </p>
                </div>
              )}
              {order.installation.position.length > 0 && (
                <div>
                  <p className="text-[#a0a0a0] mb-1">安装位置</p>
                  <p className="text-[#eaeaea]">
                    {order.installation.position.join(', ')}
                  </p>
                </div>
              )}
              {order.installation.result && (
                <div>
                  <p className="text-[#a0a0a0] mb-1">安装结果</p>
                  <p className="text-[#eaeaea]">{order.installation.result}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {order.exceptions.length > 0 && (
          <div className="bg-[#16213e] rounded-lg p-4 border border-[#e94560]/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-[#e94560]" />
              <h3 className="text-sm font-semibold text-[#eaeaea]">异常记录</h3>
              <span className="ml-auto px-2 py-0.5 bg-[#e94560]/10 text-[#e94560] text-xs rounded-full">
                {order.exceptions.length}
              </span>
            </div>
            <div className="space-y-4">
              {order.exceptions.map((exc) => (
                <div key={exc.id} className="bg-[#1a1a2e] rounded p-4 border-l-4 border-l-[#e94560]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#e94560]">
                        {exceptionTypeLabels[exc.type]}
                      </span>
                      <span
                        className={clsx(
                          'px-2 py-0.5 text-xs rounded',
                          {
                            low: 'bg-[#a0a0a0]/10 text-[#a0a0a0]',
                            medium: 'bg-[#3498db]/10 text-[#3498db]',
                            high: 'bg-[#f39c12]/10 text-[#f39c12]',
                            critical: 'bg-[#e94560]/10 text-[#e94560]',
                          }[exc.severity]
                        )}
                      >
                        {exc.severity === 'high' ? '高' : exc.severity === 'critical' ? '紧急' : exc.severity}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#a0a0a0]">
                        {format(exc.discoveredAt, 'MM/dd HH:mm', { locale: zhCN })}
                      </span>
                      <div className="mt-1">
                        <span
                          className={clsx(
                            'px-2 py-0.5 text-xs rounded',
                            {
                              open: 'bg-[#f39c12]/10 text-[#f39c12]',
                              analyzing: 'bg-[#3498db]/10 text-[#3498db]',
                              handling: 'bg-[#3498db]/10 text-[#3498db]',
                              resolved: 'bg-[#27ae60]/10 text-[#27ae60]',
                              escalated: 'bg-[#e94560]/10 text-[#e94560]',
                              closed: 'bg-[#a0a0a0]/10 text-[#a0a0a0]',
                            }[exc.status]
                          )}
                        >
                          {exceptionStatusLabels[exc.status]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[#eaeaea] mb-3">{exc.description}</p>

                  <div className="space-y-2 text-xs">
                    {exc.details.expected && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#a0a0a0]">期望:</span>
                        <span className="text-[#eaeaea]">{exc.details.expected}</span>
                      </div>
                    )}
                    {exc.details.actual && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#a0a0a0]">实际:</span>
                        <span className="text-[#eaeaea]">{exc.details.actual}</span>
                      </div>
                    )}

                    {exc.analysis && (
                      <div className="mt-3 pt-3 border-t border-[#16213e] space-y-2">
                        {exc.analysis.reason ? (
                          <div className="flex items-start gap-2">
                            <ChevronRight size={12} className="text-[#a0a0a0] mt-0.5" />
                            <div>
                              <span className="text-[#a0a0a0]">原因分析: </span>
                              <span className="text-[#eaeaea]">{exc.analysis.reason}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <ChevronRight size={12} className="text-[#a0a0a0] mt-0.5" />
                            <span className="text-[#f39c12]">原因分析: 待补充</span>
                          </div>
                        )}
                        {exc.analysis.measures && (
                          <div className="flex items-start gap-2">
                            <ChevronRight size={12} className="text-[#a0a0a0] mt-0.5" />
                            <div>
                              <span className="text-[#a0a0a0]">处理措施: </span>
                              <span className="text-[#eaeaea]">{exc.analysis.measures}</span>
                            </div>
                          </div>
                        )}
                        {exc.analysis.handledBy && (
                          <div className="flex items-start gap-2">
                            <ChevronRight size={12} className="text-[#a0a0a0] mt-0.5" />
                            <div>
                              <span className="text-[#a0a0a0]">处理人: </span>
                              <span className="text-[#eaeaea]">{exc.analysis.handledBy}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-2 mb-3">
            <History size={18} className="text-[#0f3460]" />
            <h3 className="text-sm font-semibold text-[#eaeaea]">操作日志</h3>
            <span className="ml-auto px-2 py-0.5 bg-[#0f3460]/10 text-[#0f3460] text-xs rounded-full">
              {order.logs.length} 条
            </span>
          </div>
          <div className="space-y-3">
            {order.logs.map((log, index) => (
              <div key={log.id} className="flex gap-3">
                <div className="relative flex-shrink-0">
                  <div
                    className={clsx(
                      'w-2 h-2 rounded-full mt-2',
                      {
                        work_order: 'bg-[#0f3460]',
                        dispatch: 'bg-[#3498db]',
                        exception: 'bg-[#e94560]',
                      }[log.entityType]
                    )}
                  />
                  {index < order.logs.length - 1 && (
                    <div className="absolute top-4 left-1 w-px h-full bg-[#1a1a2e] -translate-x-1/2" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-[#eaeaea]">{log.action}</span>
                    <span className="text-xs text-[#a0a0a0]">
                      {format(log.timestamp, 'HH:mm:ss', { locale: zhCN })}
                    </span>
                  </div>
                  <p className="text-xs text-[#a0a0a0] mb-1">
                    {log.operator.name} · {log.operator.role}
                  </p>

                  {log.changes && log.changes.length > 0 && (
                    <div className="mt-2 p-2 bg-[#1a1a2e] rounded text-xs space-y-1">
                      {log.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="space-y-1">
                          <div className="text-[#a0a0a0]">
                            {change.field}:
                          </div>
                          {change.before && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#e94560] line-through">
                                {String(change.before)}
                              </span>
                              <span className="text-[#a0a0a0]">→</span>
                              <span className="text-[#27ae60]">
                                {String(change.after)}
                              </span>
                            </div>
                          )}
                          {!change.before && (
                            <div className="text-[#27ae60]">
                              {String(change.after)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

      {(isPending || isInProgress || isSuspended) && (
        <div className="fixed bottom-0 left-96 right-0 bg-[#16213e] border-t border-[#1a1a2e] p-4">
          <div className="flex items-center justify-between max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#a0a0a0]">快速操作:</span>
              {isPending && !hasTechnician && (
                <button
                  onClick={handleDispatch}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0f3460] hover:bg-[#3498db] text-white rounded-lg transition-colors"
                >
                  <User size={16} />
                  <span className="text-sm font-medium">派工</span>
                </button>
              )}
              {(isPending || isInProgress || isSuspended) && (
                <button
                  onClick={handleReportException}
                  className="flex items-center gap-2 px-4 py-2 bg-[#e94560] hover:bg-[#c0392b] text-white rounded-lg transition-colors"
                >
                  <AlertTriangle size={16} />
                  <span className="text-sm font-medium">上报异常</span>
                </button>
              )}
              {isInProgress && (
                <>
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-2 px-4 py-2 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded-lg transition-colors"
                  >
                    <Pause size={16} />
                    <span className="text-sm font-medium">暂停</span>
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-4 py-2 bg-[#27ae60] hover:bg-[#229954] text-white rounded-lg transition-colors"
                  >
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">完成</span>
                  </button>
                </>
              )}
              {isSuspended && (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg transition-colors"
                >
                  <Play size={16} />
                  <span className="text-sm font-medium">继续</span>
                </button>
              )}
            </div>

            <div className="text-xs text-[#a0a0a0]">
              {order.status === 'pending' && '待派工'}
              {order.status === 'in_progress' && '施工中'}
              {order.status === 'suspended' && '已暂停'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
