import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Check, MessageSquare, User, Building, Calendar, FileText,
  CheckCircle2, XCircle, Edit3, Handshake, FileQuestion, DollarSign, CalendarClock
} from 'lucide-react';
import {
  useStore, formatDateTime, getEmployeeTraining, getEmployeeLogs, getEmployeeActiveRisks,
  getEmployeeAllRisks, getEmployeeDocuments, getTrainingHandover, getMissingDocuments,
  getMissingReasons,
} from '@/store';
import { STATUS_LABEL, ROLE_LABEL } from '@/constants';
import type { DocumentType } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import RiskBadge from '@/components/RiskBadge';
import RoleAvatar from '@/components/RoleAvatar';
import { cn } from '@/lib/utils';

export default function DocumentsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    employees,
    updateDocument,
    currentUser,
  } = useStore();

  const employee = employees.find((e) => e.id === id);
  const training = getEmployeeTraining(id!);
  const handover = getTrainingHandover(id!);
  const logs = getEmployeeLogs(id!);
  const activeRisks = getEmployeeActiveRisks(id!);
  const allRisks = getEmployeeAllRisks(id!);
  const docs = getEmployeeDocuments(id!);
  const missing = getMissingDocuments(id!);
  const missingReasons = getMissingReasons(id!);

  const salaryDeduction = activeRisks.find((r) => r.flagType === 'salary_deduction');
  const attendanceDispute = activeRisks.find((r) => r.flagType === 'attendance_dispute');
  const otherRisks = activeRisks.filter((r) => r.flagType !== 'salary_deduction' && r.flagType !== 'attendance_dispute');

  const [editingDoc, setEditingDoc] = useState<DocumentType | null>(null);
  const [docRemark, setDocRemark] = useState('');

  const canEdit = currentUser.role === 'site_supervisor';
  const isPayrollView = currentUser.role === 'payroll_accountant';

  if (!employee) {
    return (
      <div className="card p-12 text-center">
        <div className="text-ink-500">未找到该员工信息</div>
        <Link to="/documents" className="btn btn-primary btn-sm mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  const collectedCount = docs.filter((d) => d.collected).length;
  const progress = (collectedCount / docs.length) * 100;

  const handleToggleDocument = (docType: DocumentType, collected: boolean) => {
    if (!canEdit) return;
    const remark = editingDoc === docType && docRemark.trim() ? docRemark.trim() : undefined;
    updateDocument(id!, docType, collected, remark);
    setEditingDoc(null);
    setDocRemark('');
  };

  const startEditRemark = (docType: DocumentType, currentRemark?: string) => {
    if (!canEdit) return;
    setEditingDoc(docType);
    setDocRemark(currentRemark || '');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/documents')}>
          <ArrowLeft size={16} />
          返回
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-semibold text-ink-900">
            {employee.name} - 证件收集
          </h1>
          <p className="text-sm text-ink-500">
            {employee.dispatchCompany} · {employee.position}
          </p>
        </div>
        <StatusBadge status={employee.currentStatus} />
      </div>

      {isPayrollView && (salaryDeduction || attendanceDispute) && (
        <div className="card p-5 border-l-4 border-l-rose bg-rose/[0.04] animate-slide-up">
          <div className="font-medium text-ink-800 text-sm mb-3">⚠️ 薪酬会计优先关注事项</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {salaryDeduction && (
              <div className="p-3 rounded bg-rose/10 border border-rose/20">
                <div className="flex items-center gap-1.5 text-rose text-xs font-medium mb-1">
                  <DollarSign size={12} />
                  工资扣款标记
                </div>
                <div className="text-sm text-ink-700">{salaryDeduction.description}</div>
                <div className="text-[11px] text-ink-400 mt-1">
                  标记人：{salaryDeduction.flaggedBy} · {formatDateTime(salaryDeduction.flaggedAt)}
                </div>
              </div>
            )}
            {attendanceDispute && (
              <div className="p-3 rounded bg-amber/10 border border-amber/20">
                <div className="flex items-center gap-1.5 text-amber text-xs font-medium mb-1">
                  <CalendarClock size={12} />
                  考勤争议标记
                </div>
                <div className="text-sm text-ink-700">{attendanceDispute.description}</div>
                <div className="text-[11px] text-ink-400 mt-1">
                  标记人：{attendanceDispute.flaggedBy} · {formatDateTime(attendanceDispute.flaggedAt)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {handover && (
        <div className="card p-5 border-l-4 border-l-brand-600 bg-brand-50/30">
          <div className="flex items-start gap-3">
            <Handshake size={20} className="text-brand-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-ink-800 text-sm">
                  培训交接摘要（培训 → 证件）
                </div>
                <span className="text-[10px] text-ink-400 bg-white px-2 py-0.5 rounded border border-brand-100">
                  {ROLE_LABEL[handover.operatorRole]} 交接
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="text-sm text-ink-600 bg-white p-3 rounded border border-brand-100">
                    {handover.remark || training?.trainingRemark || '（无备注）'}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-400">
                    <User size={11} />
                    <span className="font-medium text-ink-600">{handover.operator}</span>
                    <span>·</span>
                    <span>{formatDateTime(handover.timestamp)}</span>
                    {training?.trainer && training.trainer !== handover.operator && (
                      <>
                        <span>·</span>
                        <span>培训师：{training.trainer}</span>
                      </>
                    )}
                  </div>
                </div>
                {training && (
                  <div className="text-[11px] space-y-1 bg-white p-3 rounded border border-brand-100">
                    <div className="flex justify-between">
                      <span className="text-ink-500">安全培训</span>
                      <span className={training.safetyTraining ? 'text-emerald font-medium' : 'text-rose'}>
                        {training.safetyTraining ? '✓ 完成' : '✗ 未完成'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-500">公司规章</span>
                      <span className={training.companyRules ? 'text-emerald font-medium' : 'text-rose'}>
                        {training.companyRules ? '✓ 完成' : '✗ 未完成'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-500">岗位技能</span>
                      <span className={training.positionSkill ? 'text-emerald font-medium' : 'text-rose'}>
                        {training.positionSkill ? '✓ 完成' : '✗ 未完成'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-500">应急流程</span>
                      <span className={training.emergencyProcedure ? 'text-emerald font-medium' : 'text-rose'}>
                        {training.emergencyProcedure ? '✓ 完成' : '✗ 未完成'}
                      </span>
                    </div>
                    <div className="pt-1.5 mt-1.5 border-t border-ink-100 flex justify-between">
                      <span className="text-ink-500">培训结果</span>
                      <span className={training.trainingResult === 'passed' ? 'text-emerald font-medium' : 'text-rose font-medium'}>
                        {training.trainingResult === 'passed' ? '通过' : '未通过'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="card p-5 border-l-4 border-l-amber bg-amber/[0.03]">
          <div className="flex items-start gap-3">
            <FileQuestion size={20} className="text-amber mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-ink-800 text-sm mb-2">
                未收齐证件 · {missing.length} 项
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {missing.map((m) => (
                  <div key={m.docId} className="p-3 rounded bg-white border border-amber/20">
                    <div className="text-sm font-medium text-ink-700 mb-1">{m.documentName}</div>
                    {m.remark ? (
                      <div className="text-xs text-ink-500 bg-amber/5 p-2 rounded">
                        {m.remark}
                      </div>
                    ) : (
                      <div className="text-xs text-ink-300">未登记原因</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-semibold text-ink-800">证件收集清单</h2>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      progress === 100 ? 'bg-emerald' : 'bg-brand-500'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-ink-600 tabular-nums">
                  {collectedCount}/{docs.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    'p-4 rounded-[4px] border-2 transition-all',
                    doc.collected
                      ? 'bg-emerald/5 border-emerald/30'
                      : 'bg-white border-ink-200 border-dashed'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        className={cn(
                          'w-6 h-6 rounded flex items-center justify-center border-2 transition-colors',
                          doc.collected
                            ? 'bg-emerald border-emerald'
                            : 'border-ink-300',
                          !canEdit && 'cursor-not-allowed opacity-60'
                        )}
                        onClick={() => handleToggleDocument(doc.documentType, !doc.collected)}
                      >
                        {doc.collected && <Check size={14} className="text-white" />}
                      </button>
                      <div>
                        <div className="font-medium text-ink-800 text-sm flex items-center gap-2">
                          {doc.documentName}
                          {doc.collected && (
                            <CheckCircle2 size={14} className="text-emerald" />
                          )}
                          {!doc.collected && (
                            <XCircle size={14} className="text-ink-300" />
                          )}
                        </div>
                        {doc.collectedDate && (
                          <div className="text-[11px] text-ink-400 mt-0.5">
                            收集日期：{doc.collectedDate}
                          </div>
                        )}
                        {doc.updatedBy && doc.collected && (
                          <div className="text-[11px] text-ink-400">
                            操作人：{doc.updatedBy}
                          </div>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        className="p-1 rounded hover:bg-ink-100 text-ink-400 hover:text-ink-600 transition-colors"
                        onClick={() => startEditRemark(doc.documentType, doc.remark)}
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>

                  {editingDoc === doc.documentType && (
                    <div className="mt-3 pt-3 border-t border-ink-100">
                      <textarea
                        className="field min-h-[60px] text-xs"
                        placeholder="添加备注说明，例如：健康证三日内补交..."
                        value={docRemark}
                        onChange={(e) => setDocRemark(e.target.value)}
                        autoFocus
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => {
                            setEditingDoc(null);
                            setDocRemark('');
                          }}
                        >
                          取消
                        </button>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => handleToggleDocument(doc.documentType, doc.collected)}
                        >
                          保存备注
                        </button>
                      </div>
                    </div>
                  )}

                  {editingDoc !== doc.documentType && doc.remark && (
                    <div className="mt-3 pt-3 border-t border-ink-100">
                      <div className="text-xs text-ink-500 bg-ink-50 p-2 rounded">
                        {doc.remark}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canEdit && employee.currentStatus !== 'completed' && (
              <div className="mt-6 pt-6 border-t border-ink-100">
                <div className="text-xs text-ink-500 mb-3">
                  提示：点击左侧复选框标记证件已收集，所有证件收集完成后状态将自动更新为"已完成"
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-semibold text-ink-800">风险标记记录</h2>
            </div>

            {activeRisks.length > 0 ? (
              <div className="space-y-3">
                {salaryDeduction && (
                  <div className="p-4 rounded-[4px] border-l-4 border-l-rose bg-rose/5 animate-slide-up" style={{ animationDelay: '0ms' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose text-white text-[10px] font-medium">
                          <DollarSign size={10} />
                          工资扣款
                        </div>
                        <div>
                          <div className="text-sm text-ink-800 font-medium">
                            {salaryDeduction.description}
                          </div>
                          <div className="text-xs text-ink-500 mt-1 flex items-center gap-2">
                            <span>
                              {salaryDeduction.flaggedBy} ·{' '}
                              {formatDateTime(salaryDeduction.flaggedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {attendanceDispute && (
                  <div className="p-4 rounded-[4px] border-l-4 border-l-amber bg-amber/5 animate-slide-up" style={{ animationDelay: '60ms' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber text-white text-[10px] font-medium">
                          <CalendarClock size={10} />
                          考勤争议
                        </div>
                        <div>
                          <div className="text-sm text-ink-800 font-medium">
                            {attendanceDispute.description}
                          </div>
                          <div className="text-xs text-ink-500 mt-1 flex items-center gap-2">
                            <span>
                              {attendanceDispute.flaggedBy} ·{' '}
                              {formatDateTime(attendanceDispute.flaggedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {otherRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-4 rounded-[4px] border-l-4 border-l-amber bg-amber/5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <RiskBadge type={risk.flagType} pulse={false} />
                        <div>
                          <div className="text-sm text-ink-800">
                            {risk.description}
                          </div>
                          <div className="text-xs text-ink-500 mt-1 flex items-center gap-2">
                            <span>
                              {risk.flaggedBy} ·{' '}
                              {formatDateTime(risk.flaggedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-ink-400 text-sm">
                暂无活跃风险标记
              </div>
            )}

            {allRisks.filter((r) => !r.active).length > 0 && (
              <div className="mt-4 pt-4 border-t border-ink-100">
                <div className="text-xs text-ink-500 mb-3">已解决风险</div>
                <div className="space-y-2">
                  {allRisks
                    .filter((r) => !r.active)
                    .map((risk) => (
                      <div
                        key={risk.id}
                        className="p-3 rounded-[4px] border border-ink-100 opacity-60"
                      >
                        <div className="flex items-center gap-2 text-xs text-ink-500">
                          <s>{risk.description}</s>
                        </div>
                        <div className="text-[11px] text-ink-400 mt-1">
                          {risk.resolvedRemark} · {risk.resolvedAt &&
                            formatDateTime(risk.resolvedAt)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-serif font-semibold text-ink-800 mb-4">
              员工信息
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User size={14} className="text-ink-400" />
                <span className="text-ink-500">姓名</span>
                <span className="flex-1 text-right text-ink-800">
                  {employee.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Building size={14} className="text-ink-400" />
                <span className="text-ink-500">派遣单位</span>
                <span className="flex-1 text-right text-ink-800">
                  {employee.dispatchCompany}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <FileText size={14} className="text-ink-400" />
                <span className="text-ink-500">岗位</span>
                <span className="flex-1 text-right text-ink-800">
                  {employee.position}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-ink-400" />
                <span className="text-ink-500">入职日期</span>
                <span className="flex-1 text-right text-ink-800">
                  {employee.entryDate}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <RoleAvatar role={employee.currentOwner} size="sm" />
                <span className="text-ink-500">当前责任人</span>
                <span className="flex-1 text-right text-ink-800">
                  {ROLE_LABEL[employee.currentOwner]}
                </span>
              </div>
            </div>
          </div>

          {training && (
            <div className="card p-5">
              <h3 className="font-serif font-semibold text-ink-800 mb-4">
                培训记录
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-500">安全培训</span>
                  <span className={training.safetyTraining ? 'text-emerald' : 'text-rose'}>
                    {training.safetyTraining ? '已完成' : '未完成'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">公司规章</span>
                  <span className={training.companyRules ? 'text-emerald' : 'text-rose'}>
                    {training.companyRules ? '已完成' : '未完成'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">岗位技能</span>
                  <span className={training.positionSkill ? 'text-emerald' : 'text-rose'}>
                    {training.positionSkill ? '已完成' : '未完成'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">应急流程</span>
                  <span className={training.emergencyProcedure ? 'text-emerald' : 'text-rose'}>
                    {training.emergencyProcedure ? '已完成' : '未完成'}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-ink-100">
                  <div className="flex justify-between">
                    <span className="text-ink-500">培训结果</span>
                    <span className={cn(
                      'font-medium',
                      training.trainingResult === 'passed' ? 'text-emerald' :
                      training.trainingResult === 'failed' ? 'text-rose' : 'text-ink-500'
                    )}>
                      {training.trainingResult === 'passed' ? '通过' :
                       training.trainingResult === 'failed' ? '未通过' : '待定'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-serif font-semibold text-ink-800 mb-4">
              状态变更时间线
            </h3>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-ink-200" />
              <div className="space-y-4">
                {logs.map((log, idx) => (
                  <div key={log.id} className="relative pl-6">
                    <div
                      className={cn(
                        'absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white',
                        idx === 0
                          ? 'border-brand-600'
                          : 'border-ink-300'
                      )}
                    />
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-500">
                          {STATUS_LABEL[log.toStatus]}
                        </span>
                        <span className="text-[10px] text-ink-400">
                          {log.operator}
                        </span>
                      </div>
                      {log.remark && (
                        <div className={cn(
                          'text-xs mt-0.5 p-2 rounded',
                          idx === 0 ? 'text-ink-600 bg-ink-50' : 'text-ink-500'
                        )}>
                          {log.remark}
                        </div>
                      )}
                      <div className="text-[10px] text-ink-400 mt-0.5">
                        {formatDateTime(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
