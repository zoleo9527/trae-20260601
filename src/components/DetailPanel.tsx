import { X, Calendar, Clock, AlertTriangle, CheckCircle2, DollarSign, User, FileText, ShieldAlert, ShieldCheck, Plus, FileEdit, UserCheck, Zap, Ban } from 'lucide-react';
import StatusBadge from './StatusBadge';
import Avatar from './Avatar';
import HistoryTimeline from './HistoryTimeline';
import { useReminderStore } from '../store/reminder';
import {
  formatDateTime,
  maskIdCard,
  maskPhone,
  roleMap,
  paymentMap,
  formatDate,
  riskLevelMap,
  riskCategoryMap,
} from '../utils/format';
import type { Reminder, UserRole, RiskRecord } from '../../shared/types';

interface Props {
  reminder: Reminder;
  onOpenSchedule: () => void;
  onOpenExecute: () => void;
  onOpenConfirmFee: () => void;
  onOpenDispute: () => void;
  onOpenReview: (type: 'approve' | 'reject') => void;
  onOpenResolveDispute: () => void;
  onOpenMarkRisk: () => void;
  onOpenResolveRisk: (riskId: string) => void;
}

const motorcycleTypeMap: Record<string, string> = {
  E: '普通二轮摩托车（E）',
  D: '普通三轮摩托车（D）',
  F: '轻便摩托车（F）',
};

export default function DetailPanel({
  reminder,
  onOpenSchedule,
  onOpenExecute,
  onOpenConfirmFee,
  onOpenDispute,
  onOpenReview,
  onOpenResolveDispute,
  onOpenMarkRisk,
  onOpenResolveRisk,
}: Props) {
  const { setSelectedId, currentRole, currentUserId } = useReminderStore();
  const isOwner = reminder.currentOwnerId === currentUserId;
  const canAct = isOwner || currentRole === 'safety_officer';
  const hasActiveRisk = reminder.riskLevel !== 'none';
  const isHighRisk = reminder.riskLevel === 'high' || reminder.riskLevel === 'critical';
  const activeRisks = reminder.risks.filter((r) => !r.resolved);
  const resolvedRisks = reminder.risks.filter((r) => r.resolved);

  return (
    <aside className="w-[480px] bg-white border-l border-slate-200 h-full flex flex-col animate-slide-in-right">
      <div
        className={`flex items-center justify-between px-5 py-3 border-b bg-slate-50/50 ${
          isHighRisk ? 'border-b-2 border-red-400' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-serif text-base font-semibold text-navy-800 truncate">补训详情</h3>
          <StatusBadge status={reminder.status} pulse={isOwner && reminder.status !== 'completed'} />
          {hasActiveRisk && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm border font-medium ${
                riskLevelMap[reminder.riskLevel].badgeClass
              }`}
            >
              <ShieldAlert size={12} />
              {riskLevelMap[reminder.riskLevel].label}
            </span>
          )}
        </div>
        <button
          onClick={() => setSelectedId(null)}
          className="p-1 rounded-sm hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-6">
          <section className="card-inset bg-slate-50 border border-slate-200 rounded-sm p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <User size={14} className="text-navy-600" />
              学员信息
            </h4>
            <div className="flex items-start gap-3">
              <Avatar name={reminder.student.name} size="lg" />
              <div className="flex-1 min-w-0 space-y-1.5 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-slate-800 text-base">{reminder.student.name}</span>
                  <span className="text-xs text-slate-500">
                    {motorcycleTypeMap[reminder.student.motorcycleType]}
                  </span>
                </div>
                <InfoRow label="身份证号" value={maskIdCard(reminder.student.idCard)} />
                <InfoRow label="联系电话" value={maskPhone(reminder.student.phone)} />
                <InfoRow label="报名日期" value={formatDate(reminder.student.registrationDate)} />
                <InfoRow
                  label="剩余学时"
                  value={
                    <span className="text-accent-dark font-medium">{reminder.student.remainingHours} 课时</span>
                  }
                />
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText size={14} className="text-navy-600" />
              补训信息
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              <InfoRow label="补训科目" value={reminder.subject} full />
              <InfoRow label="补训原因" value={reminder.reason} full />
              <InfoRow label="原培训课时" value={`${reminder.originalHours} 课时`} />
              <InfoRow
                label="补训课时"
                value={<span className="text-accent-dark font-semibold">{reminder.makeupHours} 课时</span>}
              />
              {reminder.scheduledAt && (
                <InfoRow
                  label="安排时间"
                  value={
                    <span className="flex items-center gap-1 text-navy-700">
                      <Calendar size={12} /> {formatDateTime(reminder.scheduledAt)}
                    </span>
                  }
                  full
                />
              )}
              {reminder.assignedCoachName && (
                <InfoRow
                  label="负责教练"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Avatar name={reminder.assignedCoachName} role="coach" size="sm" />
                      {reminder.assignedCoachName}
                    </span>
                  }
                  full
                />
              )}
              {reminder.executedAt && (
                <InfoRow
                  label="执行时间"
                  value={
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Clock size={12} /> {formatDateTime(reminder.executedAt)}
                    </span>
                  }
                  full
                />
              )}
              {reminder.executedRemark && (
                <div className="col-span-2 mt-1">
                  <div className="text-xs text-slate-500 mb-1">教练执行记录</div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm text-sm text-emerald-800 leading-relaxed">
                    {reminder.executedRemark}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <DollarSign size={14} className="text-accent-dark" />
              费用确认
            </h4>
            <div className="card-inset bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-sm p-4">
              <div className="space-y-2 text-sm">
                <FeeRow label="基础费用" value={reminder.fee.baseFee} />
                <FeeRow label="加时费用" value={reminder.fee.extraHoursFee} />
                {reminder.fee.materialFee ? (
                  <FeeRow label="材料费用" value={reminder.fee.materialFee} />
                ) : null}
                <div className="border-t border-amber-200/60 my-2" />
                <div className="flex justify-between items-center pt-1">
                  <span className="font-semibold text-navy-800">合计应收</span>
                  <span className="text-accent-dark text-2xl font-bold font-serif tabular-nums">
                    ¥{reminder.fee.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-amber-200/60">
                  <span className="text-slate-600 text-xs">缴费状态</span>
                  <span className={`text-sm font-medium ${paymentMap[reminder.fee.paymentStatus].className}`}>
                    {paymentMap[reminder.fee.paymentStatus].label}
                  </span>
                </div>
                {reminder.fee.confirmedBy && (
                  <>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>确认人</span>
                      <span className="text-slate-700">{reminder.fee.confirmedBy}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>确认时间</span>
                      <span className="text-slate-700 tabular-nums">
                        {formatDateTime(reminder.fee.confirmedAt || '')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-navy-600" />
              当前责任人
            </h4>
            <div className="flex items-center gap-3 p-3 bg-navy-50/50 border border-navy-100 rounded-sm">
              <Avatar
                name={reminder.currentOwnerName}
                role={reminder.currentOwnerRole as UserRole}
                size="lg"
              />
              <div>
                <div className="font-medium text-slate-800">{reminder.currentOwnerName}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`px-1.5 py-0.5 rounded-sm ${roleMap[reminder.currentOwnerRole].className}`}
                  >
                    {roleMap[reminder.currentOwnerRole].label}
                  </span>
                  {isOwner && <span className="text-accent font-medium">（当前登录账号）</span>}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ShieldAlert size={14} className="text-orange-500" />
                责任风险标记
                {activeRisks.length > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-sm border font-medium ${
                      riskLevelMap[reminder.riskLevel].badgeClass
                    }`}
                  >
                    {activeRisks.length} 项待处理
                  </span>
                )}
              </h4>
              {canAct && (
                <button
                  onClick={onOpenMarkRisk}
                  className="text-xs text-navy-600 hover:text-navy-800 flex items-center gap-0.5 hover:underline"
                >
                  <Plus size={12} />
                  标记风险
                </button>
              )}
            </div>

            {reminder.risks.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-sm border border-dashed border-slate-200">
                <ShieldCheck size={20} className="mx-auto mb-1 text-slate-300" />
                暂无风险记录
              </div>
            ) : (
              <div className="space-y-2">
                {activeRisks.map((risk) => (
                  <RiskItem
                    key={risk.id}
                    risk={risk}
                    canResolve={canAct}
                    onResolve={() => onOpenResolveRisk(risk.id)}
                  />
                ))}
                {resolvedRisks.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                      <ShieldCheck size={12} />
                      已解除风险 ({resolvedRisks.length})
                    </div>
                    <div className="space-y-1.5 opacity-60">
                      {resolvedRisks.map((risk) => (
                        <RiskItem key={risk.id} risk={risk} canResolve={false} onResolve={() => {}} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {currentRole === 'enroller' && reminder.status !== 'completed' && (
            <section className="card-inset bg-emerald-50/50 border border-emerald-200 rounded-sm p-4">
              <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-600" />
                报名员快捷操作
              </h4>
              <div className="space-y-2">
                {(reminder.status === 'pending_confirm' || reminder.status === 'disputed') ? (
                  <button
                    onClick={onOpenConfirmFee}
                    className="w-full px-3 py-2.5 text-sm text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 transition-colors font-medium flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      费用确认
                    </span>
                    {reminder.status === 'disputed' && activeRisks.some((r) => r.category === 'fee_discrepancy') && (
                      <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-sm">含费用争议风险</span>
                    )}
                  </button>
                ) : (
                  <div className="text-xs text-emerald-700/70 flex items-center gap-1.5">
                    <Clock size={12} />
                    待教练执行完成后可进行费用确认
                  </div>
                )}
                {reminder.status === 'pending_confirm' && activeRisks.some((r) => r.category === 'schedule_delay') && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2.5 py-1.5 flex items-start gap-1.5">
                    <AlertTriangle size={12} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>存在安排延误风险，请尽快确认费用避免超期</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {currentRole === 'coach' && reminder.status !== 'completed' && (
            <section className="card-inset bg-accent/5 border border-accent/20 rounded-sm p-4">
              <h4 className="text-sm font-semibold text-accent-dark mb-3 flex items-center gap-2">
                <FileEdit size={14} className="text-accent" />
                教练快捷操作
              </h4>
              <div className="space-y-2">
                {reminder.status === 'pending_execute' ? (
                  <button
                    onClick={onOpenExecute}
                    className="w-full px-3 py-2.5 text-sm text-white bg-accent rounded-sm hover:bg-accent-dark transition-colors font-medium flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      执行补训完成
                    </span>
                  </button>
                ) : reminder.status === 'pending_confirm' && activeRisks.some((r) => r.category === 'missing_record') ? (
                  <button
                    onClick={onOpenExecute}
                    className="w-full px-3 py-2.5 text-sm text-white bg-amber-600 rounded-sm hover:bg-amber-700 transition-colors font-medium flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <FileEdit size={14} />
                      补录执行记录
                    </span>
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-sm">记录缺失</span>
                  </button>
                ) : reminder.status === 'pending_schedule' ? (
                  <div className="text-xs text-accent-dark/70 flex items-center gap-1.5">
                    <Clock size={12} />
                    待报名员安排补训时间
                  </div>
                ) : reminder.status === 'pending_confirm' ? (
                  <div className="text-xs text-emerald-700/70 flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    执行已完成，待报名员确认费用
                  </div>
                ) : null}
                {activeRisks.some((r) => r.category === 'coach_overload') && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2.5 py-1.5 flex items-start gap-1.5">
                    <AlertTriangle size={12} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>存在带教负荷预警，请合理安排训练时间</span>
                  </div>
                )}
                {activeRisks.some((r) => r.category === 'safety_concern') && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-sm px-2.5 py-1.5 flex items-start gap-1.5">
                    <Ban size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <span>存在安全隐患，请务必整改后再安排训练</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {currentRole === 'safety_officer' && (
            <section className="card-inset bg-red-50/50 border border-red-200 rounded-sm p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                <ShieldAlert size={14} className="text-red-600" />
                安全员快捷操作
              </h4>
              <div className="space-y-2">
                {reminder.status === 'disputed' && (
                  <button
                    onClick={onOpenResolveDispute}
                    className="w-full px-3 py-2.5 text-sm text-white bg-red-600 rounded-sm hover:bg-red-700 transition-colors font-medium flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck size={14} />
                      介入争议处理
                    </span>
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-sm">待处理</span>
                  </button>
                )}
                {activeRisks.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs text-red-700 font-medium flex items-center gap-1">
                      <Zap size={12} />
                      待解除风险 ({activeRisks.length} 项)
                    </div>
                    {activeRisks.slice(0, 3).map((risk) => (
                      <div key={risk.id} className="flex items-center justify-between text-xs bg-white border border-red-100 rounded-sm px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${riskLevelMap[risk.level].dotClass}`} />
                          <span className="text-slate-700 truncate">{riskCategoryMap[risk.category]?.label}</span>
                        </div>
                        <button
                          onClick={() => onOpenResolveRisk(risk.id)}
                          className="text-red-600 hover:text-red-700 hover:underline flex-shrink-0 ml-2"
                        >
                          解除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {reminder.status !== 'completed' && reminder.status !== 'disputed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenReview('approve')}
                      className="flex-1 px-2.5 py-2 text-xs text-white bg-navy-700 rounded-sm hover:bg-navy-800 transition-colors font-medium"
                    >
                      审核通过
                    </button>
                    <button
                      onClick={() => onOpenReview('reject')}
                      className="flex-1 px-2.5 py-2 text-xs text-red-700 bg-white border border-red-200 rounded-sm hover:bg-red-50 transition-colors font-medium"
                    >
                      审核驳回
                    </button>
                  </div>
                )}
                {reminder.status !== 'completed' && reminder.status !== 'disputed' && (
                  <button
                    onClick={onOpenDispute}
                    className="w-full px-3 py-2 text-xs text-red-600 bg-white border border-red-200 rounded-sm hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle size={12} />
                    标记争议介入
                  </button>
                )}
                {reminder.status === 'completed' && (
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    流程已完成，已归档
                  </div>
                )}
                {activeRisks.some((r) => r.level === 'critical') && (
                  <div className="text-xs text-red-700 bg-red-100 border border-red-300 rounded-sm px-2.5 py-1.5 flex items-start gap-1.5 animate-pulse">
                    <AlertTriangle size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <span>存在严重风险，请在 24 小时内介入处理</span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <HistoryTimeline history={reminder.history} risks={reminder.risks} />
          </section>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 space-y-2">
        {canAct && (
          <div className="flex flex-wrap gap-2">
            {(reminder.status === 'pending_schedule' || reminder.status === 'disputed') &&
              currentRole === 'enroller' && (
                <button
                  onClick={onOpenSchedule}
                  className="px-4 py-2 text-sm text-white bg-navy-800 rounded-sm hover:bg-navy-700 transition-colors font-medium"
                >
                  安排补训
                </button>
              )}
            {reminder.status === 'pending_execute' && currentRole === 'coach' && (
              <button
                onClick={onOpenExecute}
                className="px-4 py-2 text-sm text-white bg-accent rounded-sm hover:bg-accent-dark transition-colors font-medium"
              >
                执行补训完成
              </button>
            )}
            {(reminder.status === 'pending_confirm' || reminder.status === 'disputed') &&
              currentRole === 'enroller' && (
                <button
                  onClick={onOpenConfirmFee}
                  className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 transition-colors font-medium"
                >
                  确认费用
                </button>
              )}
            {reminder.status !== 'completed' && reminder.status !== 'disputed' && (
              <button
                onClick={onOpenDispute}
                className="px-4 py-2 text-sm text-red-600 bg-white border border-red-200 rounded-sm hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
              >
                <AlertTriangle size={14} />
                标记争议
              </button>
            )}
            {currentRole === 'safety_officer' && reminder.status !== 'completed' && (
              <>
                {reminder.status === 'disputed' && (
                  <button
                    onClick={onOpenResolveDispute}
                    className="px-4 py-2 text-sm text-white bg-amber-600 rounded-sm hover:bg-amber-700 transition-colors font-medium flex items-center gap-1"
                  >
                    <AlertTriangle size={14} />
                    处理争议
                  </button>
                )}
                {reminder.status !== 'disputed' && (
                  <>
                    <button
                      onClick={() => onOpenReview('approve')}
                      className="px-4 py-2 text-sm text-white bg-navy-800 rounded-sm hover:bg-navy-700 transition-colors font-medium"
                    >
                      审核通过
                    </button>
                    <button
                      onClick={() => onOpenReview('reject')}
                      className="px-4 py-2 text-sm text-red-600 bg-white border border-red-200 rounded-sm hover:bg-red-50 transition-colors font-medium"
                    >
                      审核驳回
                    </button>
                  </>
                )}
              </>
            )}
            {currentRole === 'safety_officer' && (
              <div className="w-full text-xs text-slate-500 pt-1 border-t border-slate-200">
                安全员权限：可查看所有记录详情，审核流程合规性，介入争议处理
              </div>
            )}
          </div>
        )}
        {!canAct && reminder.status !== 'completed' && (
          <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 flex items-start gap-1.5">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              当前记录由 <span className="font-medium text-amber-700">{reminder.currentOwnerName}</span>{' '}
              （{roleMap[reminder.currentOwnerRole].label}）负责，您暂无操作权限
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

function InfoRow({
  label,
  value,
  full = false,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 ${full ? 'col-span-2' : ''}`}>
      <span className="text-slate-500 text-xs flex-shrink-0 w-[72px] pt-0.5">{label}</span>
      <span className="text-slate-800 text-sm flex-1 min-w-0">{value}</span>
    </div>
  );
}

function FeeRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center text-sm text-slate-600">
      <span>{label}</span>
      <span className="tabular-nums">¥{value.toFixed(2)}</span>
    </div>
  );
}

function RiskItem({
  risk,
  canResolve,
  onResolve,
}: {
  risk: RiskRecord;
  canResolve: boolean;
  onResolve: () => void;
}) {
  return (
    <div
      className={`p-3 rounded-sm border text-sm ${
        risk.resolved
          ? 'bg-slate-50 border-slate-200'
          : `bg-white border-l-2 ${riskLevelMap[risk.level].dotClass.replace('bg-', 'border-l-')} border-slate-200`
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs px-1.5 py-0.5 rounded-sm border font-medium ${
              riskLevelMap[risk.level].badgeClass
            }`}
          >
            {riskLevelMap[risk.level].label}
          </span>
          <span className="text-xs text-slate-500">
            {riskCategoryMap[risk.category]?.label || risk.category}
          </span>
        </div>
        {!risk.resolved && canResolve && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResolve();
            }}
            className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex-shrink-0"
          >
            解除
          </button>
        )}
      </div>
      <div className="text-slate-700 text-sm leading-relaxed mb-2">{risk.reason}</div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Avatar name={risk.markedByName} size="sm" />
          <span>{risk.markedByName}</span>
          <span className="text-slate-400">·</span>
          <span>{roleMap[risk.markedByRole]?.label || risk.markedByRole}</span>
        </div>
        <span className="tabular-nums">{formatDateTime(risk.markedAt)}</span>
      </div>
      {risk.resolved && risk.resolveRemark && (
        <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
          <span className="text-emerald-600 font-medium">解除说明：</span>
          {risk.resolveRemark}
          {risk.resolvedByName && (
            <span className="text-slate-400 ml-1">— {risk.resolvedByName}</span>
          )}
        </div>
      )}
    </div>
  );
}
