import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle2, Clock, AlertTriangle, ChevronRight, Eye, CheckSquare, Square,
  Handshake, FileQuestion, DollarSign, CalendarClock
} from 'lucide-react';
import {
  useStore, timeAgo, getEmployeeDocuments, getEmployeeActiveRisks, getEmployeeTraining,
  getTrainingHandover, getMissingDocuments, getMissingReasons, sortForPayrollAccountant,
} from '@/store';
import { DOCUMENT_LABEL, ROLE_LABEL } from '@/constants';
import type { Employee, DocumentType } from '@/types';

import StatusBadge from '@/components/StatusBadge';
import RiskBadge from '@/components/RiskBadge';
import RoleAvatar from '@/components/RoleAvatar';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/store';

export default function DocumentsPage() {
  const { employees, currentUser, toggleEmployeeSelection, selectedEmployeeIds } = useStore();

  const documentEmployees = useMemo(() => {
    const base = employees
      .filter((e) =>
        ['pending_documents', 'collecting_documents', 'completed'].includes(e.currentStatus)
      );
    return currentUser.role === 'payroll_accountant'
      ? sortForPayrollAccountant(base)
      : base.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
  }, [employees, currentUser.role]);

  const pendingDocs = documentEmployees.filter(
    (e) => e.currentStatus === 'pending_documents'
  );
  const collectingDocs = documentEmployees.filter(
    (e) => e.currentStatus === 'collecting_documents'
  );
  const completedDocs = documentEmployees.filter(
    (e) => e.currentStatus === 'completed'
  );

  const canEdit = currentUser.role === 'site_supervisor' || currentUser.role === 'payroll_accountant';

  const missingSummary = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const reasonList: { docName: string; reason: string; empName: string }[] = [];
    employees.forEach((emp) => {
      if (!['pending_documents', 'collecting_documents'].includes(emp.currentStatus)) return;
      const missing = getMissingDocuments(emp.id);
      missing.forEach((m) => {
        typeCount[m.documentName] = (typeCount[m.documentName] || 0) + 1;
        if (m.remark) {
          reasonList.push({ docName: m.documentName, reason: m.remark, empName: emp.name });
        }
      });
    });
    const sortedTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    return { sortedTypes, reasonList, totalMissingCount: Object.values(typeCount).reduce((s, n) => s + n, 0) };
  }, [employees]);

  function EmployeeRow({ emp }: { emp: Employee }) {
    const docs = getEmployeeDocuments(emp.id);
    const risks = getEmployeeActiveRisks(emp.id);
    const training = getEmployeeTraining(emp.id);
    const handover = getTrainingHandover(emp.id);
    const missing = getMissingDocuments(emp.id);
    const missingReasons = getMissingReasons(emp.id);
    const collectedCount = docs.filter((d) => d.collected).length;
    const progress = (collectedCount / docs.length) * 100;
    const isSelected = selectedEmployeeIds.includes(emp.id);
    const salaryDeduction = risks.find((r) => r.flagType === 'salary_deduction');
    const attendanceDispute = risks.find((r) => r.flagType === 'attendance_dispute');

    return (
      <div
        key={emp.id}
        className={cn(
          'card p-4 transition-all hover:shadow-card-hover',
          isSelected && 'ring-2 ring-brand-400 ring-offset-2 ring-offset-paper',
          currentUser.role === 'payroll_accountant' && (salaryDeduction || attendanceDispute) &&
            'border-l-4 border-l-rose bg-rose/[0.03]'
        )}
      >
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex items-start gap-3 flex-shrink-0">
            {canEdit && (
              <button
                className="text-ink-400 hover:text-brand-600 transition-colors mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleEmployeeSelection(emp.id);
                }}
              >
                {isSelected ? (
                  <CheckSquare size={18} className="text-brand-600" />
                ) : (
                  <Square size={18} />
                )}
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-serif font-medium">
              {emp.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-ink-800">{emp.name}</div>
                <StatusBadge status={emp.currentStatus} size="sm" />
              </div>
              <div className="text-xs text-ink-500 mt-0.5">
                {emp.dispatchCompany} · {emp.position}
              </div>
              {currentUser.role === 'payroll_accountant' && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {salaryDeduction && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose/10 text-rose font-medium">
                      <DollarSign size={10} /> {salaryDeduction.description}
                    </span>
                  )}
                  {attendanceDispute && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber/10 text-amber font-medium">
                      <CalendarClock size={10} /> {attendanceDispute.description}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
            <div className="text-xs">
              <div className="flex items-center gap-1.5 text-ink-400 mb-1.5">
                <Handshake size={12} />
                培训交接
              </div>
              {handover ? (
                <div className="bg-brand-50/60 p-2 rounded border border-brand-100">
                  <div className="text-ink-700 line-clamp-2">{handover.remark || training?.trainingRemark || '（无备注）'}</div>
                  <div className="text-[10px] text-ink-400 mt-1 flex items-center gap-2">
                    <span className="font-medium">{handover.operator}</span>
                    <span>·</span>
                    <span>{timeAgo(handover.timestamp)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-ink-300">—</div>
              )}
            </div>

            <div className="text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-ink-400">
                  <FileText size={12} />
                  收集进度
                </div>
                <span className="text-ink-600 tabular-nums">{collectedCount}/{docs.length}</span>
              </div>
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden mb-2">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    progress === 100 ? 'bg-emerald' : 'bg-brand-500'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {missing.length > 0 && (
                <div className="space-y-0.5">
                  {missing.slice(0, 2).map((m) => (
                    <div key={m.docId} className="flex items-center gap-1">
                      <FileQuestion size={10} className="text-amber flex-shrink-0" />
                      <span className="text-ink-500 truncate">{m.documentName}</span>
                    </div>
                  ))}
                  {missing.length > 2 && (
                    <div className="text-[10px] text-ink-400">+{missing.length - 2} 项待收集</div>
                  )}
                </div>
              )}
            </div>

            <div className="text-xs">
              <div className="flex items-center gap-1.5 text-ink-400 mb-1.5">
                <AlertTriangle size={12} />
                待补原因 {missingReasons.length > 0 && (
                  <span className="text-amber font-medium">({missingReasons.length})</span>
                )}
              </div>
              {missingReasons.length > 0 ? (
                <div className="space-y-1">
                  {missingReasons.slice(0, 2).map((m, idx) => (
                    <div key={idx} className="bg-amber/5 p-1.5 rounded border border-amber/20">
                      <div className="font-medium text-ink-600">{m.documentName}</div>
                      <div className="text-ink-500 line-clamp-2">{m.reason}</div>
                    </div>
                  ))}
                  {missingReasons.length > 2 && (
                    <div className="text-[10px] text-ink-400">+{missingReasons.length - 2} 条原因</div>
                  )}
                </div>
              ) : missing.length > 0 ? (
                <div className="text-ink-300">待填写补证原因</div>
              ) : (
                <div className="text-emerald flex items-center gap-1">
                  <CheckCircle2 size={12} /> 证件已收齐
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              {risks.length > 0 && (
                <div className="flex flex-wrap gap-1 max-w-[120px]">
                  {risks.slice(0, 2).map((r) => (
                    <RiskBadge key={r.id} type={r.flagType} pulse={false} showIcon={false} />
                  ))}
                  {risks.length > 2 && (
                    <span className="text-[10px] text-ink-400">+{risks.length - 2}</span>
                  )}
                </div>
              )}
              <RoleAvatar role={emp.currentOwner} size="sm" />
            </div>
            <Link
              to={`/documents/${emp.id}`}
              className="p-1.5 rounded hover:bg-brand-50 text-ink-400 hover:text-brand-600 transition-colors"
            >
              {emp.currentStatus === 'completed' ? (
                <Eye size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ title, count, subtitle }: { title: string; count: number; subtitle?: string }) => (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="font-serif font-semibold text-ink-800 text-lg">
          {title}
          <span className="ml-2 text-sm font-normal text-ink-500">{count} 人</span>
        </h2>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-ink-900">证件收集管理</h1>
          <p className="text-sm text-ink-500 mt-1">
            共 {documentEmployees.length} 名员工在证件收集阶段
            {currentUser.role === 'payroll_accountant' && (
              <span className="text-rose ml-2">· 会计视角已按工资扣款/考勤争议优先排序</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && selectedEmployeeIds.length > 0 && (
            <span className="btn btn-ghost btn-sm">
              已选择 {selectedEmployeeIds.length} 人
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200">
          <div className="flex items-center gap-3">
            <Clock className="text-brand-600" size={24} />
            <div>
              <div className="text-2xl font-serif font-semibold text-brand-700 tabular-nums">
                {pendingDocs.length}
              </div>
              <div className="text-xs text-brand-600">待开始收集</div>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber/5 to-amber/10 border-amber/30">
          <div className="flex items-center gap-3">
            <FileText className="text-amber" size={24} />
            <div>
              <div className="text-2xl font-serif font-semibold text-amber tabular-nums">
                {collectingDocs.length}
              </div>
              <div className="text-xs text-amber">收集中</div>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-emerald/5 to-emerald/10 border-emerald/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald" size={24} />
            <div>
              <div className="text-2xl font-serif font-semibold text-emerald tabular-nums">
                {completedDocs.length}
              </div>
              <div className="text-xs text-emerald">已完成</div>
            </div>
          </div>
        </div>
      </div>

      {missingSummary.totalMissingCount > 0 && (
        <div className="card p-5 border-l-4 border-l-amber bg-amber/[0.03]">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-ink-800 text-sm mb-2">
                未收齐证件汇总（共 {missingSummary.totalMissingCount} 项）
              </div>
              {missingSummary.sortedTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {missingSummary.sortedTypes.map((t) => (
                    <span key={t.name} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber/10 text-amber border border-amber/20">
                      <FileQuestion size={11} />
                      {t.name} · {t.count} 人
                    </span>
                  ))}
                </div>
              )}
              {missingSummary.reasonList.length > 0 && (
                <div className="pt-3 border-t border-amber/10">
                  <div className="text-xs text-ink-500 mb-2">已登记的待补原因：</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {missingSummary.reasonList.slice(0, 6).map((r, idx) => (
                      <div key={idx} className="text-xs p-2 bg-white rounded border border-ink-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-ink-700">{r.empName}</span>
                          <span className="text-ink-400">·</span>
                          <span className="text-amber">{r.docName}</span>
                        </div>
                        <div className="text-ink-500 mt-0.5 line-clamp-1">{r.reason}</div>
                      </div>
                    ))}
                    {missingSummary.reasonList.length > 6 && (
                      <div className="text-xs text-ink-400 flex items-center justify-center p-2">
                        +{missingSummary.reasonList.length - 6} 条更多原因
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pendingDocs.length > 0 && (
        <div>
          <SectionHeader
            title="待开始收集"
            count={pendingDocs.length}
            subtitle="培训已通过，证件收集尚未开始"
          />
          <div className="space-y-3">
            {pendingDocs.map((emp) => (
              <EmployeeRow key={emp.id} emp={emp} />
            ))}
          </div>
        </div>
      )}

      {collectingDocs.length > 0 && (
        <div>
          <SectionHeader
            title="收集中"
            count={collectingDocs.length}
            subtitle="已开始证件收集，待收齐"
          />
          <div className="space-y-3">
            {collectingDocs.map((emp) => (
              <EmployeeRow key={emp.id} emp={emp} />
            ))}
          </div>
        </div>
      )}

      {completedDocs.length > 0 && (
        <div>
          <SectionHeader
            title="已完成"
            count={completedDocs.length}
            subtitle={currentUser.role === 'payroll_accountant' ? '按风险/状态综合排序' : '证件全部收齐，可进入薪酬复核'}
          />
          <div className="space-y-3 opacity-90">
            {completedDocs.map((emp) => (
              <EmployeeRow key={emp.id} emp={emp} />
            ))}
          </div>
        </div>
      )}

      {documentEmployees.length === 0 && (
        <div className="card p-12 text-center">
          <FileText size={48} className="mx-auto text-ink-300" />
          <div className="mt-4 text-ink-500">暂无证件收集阶段的员工</div>
        </div>
      )}
    </div>
  );
}
