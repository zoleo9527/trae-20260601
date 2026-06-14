import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  Send,
  SkipForward,
  FileWarning,
  Shield,
  Info,
  Save,
  StickyNote,
} from 'lucide-react';
import { useApplicationStore } from '../store/useApplicationStore';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { MATERIAL_STATUS_LABELS } from '../types';
import type { MaterialStatus } from '../types';
import { cn } from '../lib/utils';

type ActionType = 'approve' | 'correction' | 'reject' | null;

interface CorrectionItem {
  id: string;
  materialName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const applications = useApplicationStore((s) => s.applications);
  const approveApplication = useApplicationStore((s) => s.approveApplication);
  const sendCorrection = useApplicationStore((s) => s.sendCorrection);
  const rejectApplication = useApplicationStore((s) => s.rejectApplication);
  const saveExceptionNote = useApplicationStore((s) => s.saveExceptionNote);

  const application = id ? applications.find((a) => a.id === id) : undefined;
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [remark, setRemark] = useState('');
  const [correctionItems, setCorrectionItems] = useState<CorrectionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exceptionNote, setExceptionNote] = useState<string>(application?.exceptionNote || '');
  const [isNoteSaving, setIsNoteSaving] = useState(false);

  if (!application) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--surface-ground)' }}>
        <div className="text-center">
          <FileText className="w-14 h-14 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-3">未找到该申请记录</p>
          <button
            onClick={() => navigate('/')}
            className="text-navy-600 hover:text-navy-700 text-sm font-medium"
          >
            返回工作面
          </button>
        </div>
      </div>
    );
  }

  const pendingApps = applications.filter(
    (a) => a.status === 'pending' && a.id !== id
  );
  const nextPendingId = pendingApps.length > 0 ? pendingApps[0].id : null;

  const materialStatusColor: Record<MaterialStatus, string> = {
    submitted: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    missing: 'text-red-600 bg-red-50 border-red-200',
    incorrect: 'text-amber-600 bg-amber-50 border-amber-200',
    corrected: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  const materialStatusIconBg: Record<MaterialStatus, string> = {
    submitted: 'bg-emerald-100',
    missing: 'bg-red-100',
    incorrect: 'bg-amber-100',
    corrected: 'bg-blue-100',
  };

  const materialStatusIcon: Record<MaterialStatus, string> = {
    submitted: 'text-emerald-600',
    missing: 'text-red-600',
    incorrect: 'text-amber-600',
    corrected: 'text-blue-600',
  };

  const hasProblemMaterials = application.materials.some(
    (m) => m.status === 'missing' || m.status === 'incorrect'
  );

  const addCorrectionItem = () => {
    const newItem: CorrectionItem = {
      id: `item-${Date.now()}`,
      materialName: '',
      reason: '',
      priority: 'high',
    };
    setCorrectionItems([...correctionItems, newItem]);
  };

  const updateCorrectionItem = (
    itemId: string,
    field: keyof CorrectionItem,
    value: string
  ) => {
    setCorrectionItems(
      correctionItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const removeCorrectionItem = (itemId: string) => {
    setCorrectionItems(correctionItems.filter((item) => item.id !== itemId));
  };

  const handleSaveExceptionNote = async () => {
    if (!id) return;
    setIsNoteSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    saveExceptionNote(id, exceptionNote);
    setIsNoteSaving(false);
  };

  const handleSubmit = async () => {
    if (!id) return;
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (selectedAction === 'approve') {
      approveApplication(id, remark || '材料齐全，审核通过', exceptionNote);
    } else if (selectedAction === 'correction' && correctionItems.length > 0) {
      sendCorrection(
        id,
        correctionItems.map((item) => ({
          materialName: item.materialName,
          reason: item.reason,
          priority: item.priority,
        })),
        remark || '材料需补正',
        exceptionNote
      );
    } else if (selectedAction === 'reject') {
      rejectApplication(id, remark || '不符合受理条件，予以驳回', exceptionNote);
    }

    setIsSubmitting(false);

    if (nextPendingId && selectedAction === 'approve') {
      navigate(`/review/${nextPendingId}`);
    } else {
      navigate('/');
    }
  };

  const canSubmit =
    selectedAction &&
    (selectedAction !== 'correction' || correctionItems.length > 0) &&
    !isSubmitting;

  const isReadonly =
    application.status === 'archived' || application.status === 'rejected';

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--surface-ground)' }}>
      <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b shadow-nav" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 font-mono tracking-tight">
                {application.appointmentNo}
              </h1>
              <StatusBadge status={application.status} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {application.applicantName} · {application.applicationType}
            </p>
          </div>
        </div>

        {!isReadonly && nextPendingId && (
          <button
            onClick={() => navigate(`/review/${nextPendingId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy-600 bg-navy-50 hover:bg-navy-100 border border-navy-100 rounded-lg transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            跳过
          </button>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {hasProblemMaterials && !isReadonly && (
              <div className="responsibility-boundary animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800 mb-1">
                      责任边界提醒
                    </h3>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      当前申请存在材料缺失或错误，若发送补正通知，公证员审核与补正等待之间的责任将由系统明确标注。补正通知发出后，等待申请人回复期间的责任不在公证员。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <section className="card-base p-5">
              <h2 className="section-title mb-4">
                <FileText className="w-4 h-4" />
                申请信息
              </h2>
              <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                <InfoItem label="申请人" value={application.applicantName} />
                <InfoItem label="联系电话" value={application.applicantPhone} />
                <InfoItem label="申请事项" value={application.applicationType} />
                <InfoItem label="受理窗口" value={application.windowNo} />
                <InfoItem label="受理时间" value={application.receivedAt} />
                <InfoItem label="受理员" value={application.handler} />
              </div>
            </section>

            <section className="card-base p-5">
              <h2 className="section-title mb-4">
                <FileText className="w-4 h-4" />
                材料清单
                <span className="text-[11px] text-slate-400 font-normal tracking-normal normal-case">
                  共 {application.materials.length} 份
                </span>
              </h2>
              <div className="space-y-1.5">
                {application.materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-md flex items-center justify-center',
                          materialStatusIconBg[material.status]
                        )}
                      >
                        <FileText
                          className={cn('w-3.5 h-3.5', materialStatusIcon[material.status])}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {material.name}
                        </p>
                        {material.remark && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {material.remark}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {material.isOriginal && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium border border-blue-100">
                          原件
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[11px] px-1.5 py-0.5 rounded font-medium border',
                          materialStatusColor[material.status]
                        )}
                      >
                        {MATERIAL_STATUS_LABELS[material.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card-base p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">
                  <StickyNote className="w-4 h-4" />
                  异常说明
                  <span className="text-[11px] text-slate-400 font-normal tracking-normal normal-case ml-1">
                    一线处理与管理回看共享记录
                  </span>
                </h2>
                {!isReadonly && (
                  <button
                    onClick={handleSaveExceptionNote}
                    disabled={isNoteSaving}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-navy-600 bg-navy-50 hover:bg-navy-100 border border-navy-200 rounded-md transition-colors"
                  >
                    {isNoteSaving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-navy-600/30 border-t-navy-600 rounded-full animate-spin" />
                        保存中
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        立即保存
                      </>
                    )}
                  </button>
                )}
              </div>

              {!isReadonly ? (
                <>
                  <textarea
                    value={exceptionNote}
                    onChange={(e) => setExceptionNote(e.target.value)}
                    placeholder="录入异常情况、特殊处理、需特别说明的事项...例如：申请人行动不便由代办人处理、材料真实性经上门核实等"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-start gap-1.5">
                      <Info className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        异常说明会和审核记录、补正通知一起写入归档档案，可在侧栏时间线和归档回看中追溯
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {exceptionNote.length} / 500
                    </span>
                  </div>
                </>
              ) : (
                exceptionNote ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold text-amber-700 mb-0.5">异常说明</p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {exceptionNote}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-lg">
                    <StickyNote className="w-4 h-4 text-slate-300" />
                    <p className="text-xs text-slate-400">无异常说明</p>
                  </div>
                )
              )}
            </section>

            {!isReadonly && (
              <section className="card-base p-5">
                <h2 className="section-title mb-4">
                  <AlertTriangle className="w-4 h-4" />
                  审核操作
                </h2>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <ActionButton
                    type="approve"
                    selected={selectedAction === 'approve'}
                    onClick={() => setSelectedAction('approve')}
                    icon={CheckCircle2}
                    label="审核通过"
                    description="材料齐全无误"
                    color="emerald"
                  />
                  <ActionButton
                    type="correction"
                    selected={selectedAction === 'correction'}
                    onClick={() => {
                      setSelectedAction('correction');
                      if (correctionItems.length === 0) {
                        addCorrectionItem();
                      }
                    }}
                    icon={FileWarning}
                    label="发送补正"
                    description="材料需补正"
                    color="amber"
                  />
                  <ActionButton
                    type="reject"
                    selected={selectedAction === 'reject'}
                    onClick={() => setSelectedAction('reject')}
                    icon={XCircle}
                    label="予以驳回"
                    description="不符合条件"
                    color="red"
                  />
                </div>

                {selectedAction === 'correction' && (
                  <div className="mb-5 p-4 bg-amber-50/80 border border-amber-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        补正事项
                      </h3>
                      <button
                        onClick={addCorrectionItem}
                        className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        添加补正项
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {correctionItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-lg border border-amber-200/80"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500">
                              补正项 {index + 1}
                            </span>
                            <button
                              onClick={() => removeCorrectionItem(item.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="材料名称"
                              value={item.materialName}
                              onChange={(e) =>
                                updateCorrectionItem(
                                  item.id,
                                  'materialName',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                            />
                            <textarea
                              placeholder="补正原因"
                              value={item.reason}
                              onChange={(e) =>
                                updateCorrectionItem(
                                  item.id,
                                  'reason',
                                  e.target.value
                                )
                              }
                              rows={2}
                              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">
                                优先级：
                              </span>
                              <div className="flex gap-1">
                                {(['high', 'medium', 'low'] as const).map(
                                  (p) => (
                                    <button
                                      key={p}
                                      onClick={() =>
                                        updateCorrectionItem(
                                          item.id,
                                          'priority',
                                          p
                                        )
                                      }
                                      className={cn(
                                        'px-2 py-0.5 text-[11px] rounded transition-colors',
                                        item.priority === p
                                          ? p === 'high'
                                            ? 'bg-red-100 text-red-700 font-medium'
                                            : p === 'medium'
                                            ? 'bg-amber-100 text-amber-700 font-medium'
                                            : 'bg-blue-100 text-blue-700 font-medium'
                                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                      )}
                                    >
                                      {p === 'high'
                                        ? '高'
                                        : p === 'medium'
                                        ? '中'
                                        : '低'}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 p-2.5 bg-amber-100/60 rounded-lg flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        发送补正通知后，系统将自动标注「公证员审核 → 补正等待」责任划分点，等待期间责任不在公证员
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                    审核备注
                    <span className="text-slate-400 font-normal ml-1">（可选）</span>
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请输入审核备注..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-400 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all',
                      selectedAction === 'approve'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                        : selectedAction === 'correction'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                        : selectedAction === 'reject'
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        {selectedAction === 'approve' && '确认通过'}
                        {selectedAction === 'correction' && '发送补正通知'}
                        {selectedAction === 'reject' && '确认驳回'}
                        {!selectedAction && '请选择操作'}
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="w-[360px] flex-shrink-0">
          <Sidebar application={application} mode={isReadonly ? 'archive' : 'review'} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function ActionButton({
  type,
  selected,
  onClick,
  icon: Icon,
  label,
  description,
  color,
}: {
  type: ActionType;
  selected: boolean;
  onClick: () => void;
  icon: typeof CheckCircle2;
  label: string;
  description: string;
  color: 'emerald' | 'amber' | 'red';
}) {
  const colorStyles = {
    emerald: {
      selected:
        'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-100',
      default: 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-600',
      iconBg: selected ? 'bg-emerald-100' : 'bg-slate-50',
      iconColor: 'text-emerald-500',
    },
    amber: {
      selected:
        'bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-100',
      default:
        'bg-white border-slate-200 text-slate-600 hover:border-amber-200 hover:text-amber-600',
      iconBg: selected ? 'bg-amber-100' : 'bg-slate-50',
      iconColor: 'text-amber-500',
    },
    red: {
      selected: 'bg-red-50 border-red-300 text-red-700 ring-2 ring-red-100',
      default: 'bg-white border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600',
      iconBg: selected ? 'bg-red-100' : 'bg-slate-50',
      iconColor: 'text-red-500',
    },
  };

  const styles = colorStyles[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200',
        selected ? styles.selected : styles.default
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
          selected ? styles.iconBg : 'bg-slate-50'
        )}
      >
        <Icon
          className={cn(
            'w-4.5 h-4.5 transition-colors',
            selected ? styles.iconColor : 'text-slate-400'
          )}
        />
      </div>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[10px] opacity-60">{description}</span>
    </button>
  );
}
