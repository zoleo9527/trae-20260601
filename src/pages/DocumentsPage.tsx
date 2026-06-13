import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle2, Clock, AlertTriangle, ChevronRight, Eye, CheckSquare, Square
} from 'lucide-react';
import { useStore, timeAgo, getEmployeeDocuments, getEmployeeActiveRisks, getEmployeeTraining } from '@/store';
import type { Employee } from '@/types';

import StatusBadge from '@/components/StatusBadge';
import RiskBadge from '@/components/RiskBadge';
import RoleAvatar from '@/components/RoleAvatar';
import { cn } from '@/lib/utils';

export default function DocumentsPage() {
  const { employees, currentUser, toggleEmployeeSelection, selectedEmployeeIds } = useStore();

  const documentEmployees = useMemo(() => {
    return employees
      .filter((e) =>
        ['pending_documents', 'collecting_documents', 'completed'].includes(e.currentStatus)
      )
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [employees]);

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

  function EmployeeRow({ emp }: { emp: Employee }) {
    const docs = getEmployeeDocuments(emp.id);
    const risks = getEmployeeActiveRisks(emp.id);
    const training = getEmployeeTraining(emp.id);
    const collectedCount = docs.filter((d) => d.collected).length;
    const progress = (collectedCount / docs.length) * 100;
    const isSelected = selectedEmployeeIds.includes(emp.id);

    const hasMissingWithRemarks = docs.some((d) => !d.collected && d.remark);

    return (
      <tr
        key={emp.id}
        className={cn(
          'hover:bg-ink-50/50 transition-colors',
          isSelected && 'bg-brand-50/60'
        )}
      >
        <td className="px-5 py-4">
          {canEdit && (
            <button
              className="text-ink-400 hover:text-brand-600 transition-colors"
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
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-serif font-medium text-sm">
              {emp.name.slice(0, 1)}
            </div>
            <div>
              <div className="font-medium text-ink-800">{emp.name}</div>
              <div className="text-xs text-ink-500">
                {emp.dispatchCompany} · {emp.position}
              </div>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <StatusBadge status={emp.currentStatus} />
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-[120px]">
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    progress === 100 ? 'bg-emerald' : 'bg-brand-500'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-ink-600 tabular-nums">
              {collectedCount}/{docs.length}
            </span>
          </div>
        </td>
        <td className="px-5 py-4">
          {risks.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {risks.map((r) => (
                <RiskBadge key={r.id} type={r.flagType} pulse={false} showIcon={false} />
              ))}
            </div>
          ) : (
            <span className="text-xs text-ink-300">—</span>
          )}
        </td>
        <td className="px-5 py-4">
          {training?.trainingRemark ? (
            <div className="text-xs text-ink-600 bg-ink-50 px-2 py-1 rounded max-w-[180px] line-clamp-2">
              {training.trainingRemark}
            </div>
          ) : (
            <span className="text-xs text-ink-300">—</span>
          )}
        </td>
        <td className="px-5 py-4">
          <RoleAvatar role={emp.currentOwner} size="sm" />
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-1.5 text-xs text-ink-500">
            {hasMissingWithRemarks && (
              <AlertTriangle size={12} className="text-amber" />
            )}
            {timeAgo(emp.updatedAt)}
          </div>
        </td>
        <td className="px-5 py-4">
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
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-ink-900">证件收集管理</h1>
          <p className="text-sm text-ink-500 mt-1">
            共 {documentEmployees.length} 名员工在证件收集阶段
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

      {pendingDocs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 bg-brand-50/50">
            <h2 className="font-serif font-semibold text-ink-800">
              待开始收集
              <span className="ml-2 text-xs font-normal text-ink-500">
                {pendingDocs.length} 人
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50">
                <tr className="text-left text-xs text-ink-500">
                  <th className="px-5 py-3 w-10"></th>
                  <th className="px-5 py-3 font-medium">员工</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">收集进度</th>
                  <th className="px-5 py-3 font-medium">风险</th>
                  <th className="px-5 py-3 font-medium">培训备注</th>
                  <th className="px-5 py-3 font-medium">责任人</th>
                  <th className="px-5 py-3 font-medium">最近更新</th>
                  <th className="px-5 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {pendingDocs.map((emp) => (
                  <EmployeeRow key={emp.id} emp={emp} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {collectingDocs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 bg-amber/5">
            <h2 className="font-serif font-semibold text-ink-800">
              收集中
              <span className="ml-2 text-xs font-normal text-ink-500">
                {collectingDocs.length} 人
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50">
                <tr className="text-left text-xs text-ink-500">
                  <th className="px-5 py-3 w-10"></th>
                  <th className="px-5 py-3 font-medium">员工</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">收集进度</th>
                  <th className="px-5 py-3 font-medium">风险</th>
                  <th className="px-5 py-3 font-medium">培训备注</th>
                  <th className="px-5 py-3 font-medium">责任人</th>
                  <th className="px-5 py-3 font-medium">最近更新</th>
                  <th className="px-5 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {collectingDocs.map((emp) => (
                  <EmployeeRow key={emp.id} emp={emp} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {completedDocs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 bg-emerald/5">
            <h2 className="font-serif font-semibold text-ink-800">
              已完成
              <span className="ml-2 text-xs font-normal text-ink-500">
                {completedDocs.length} 人
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50">
                <tr className="text-left text-xs text-ink-500">
                  <th className="px-5 py-3 w-10"></th>
                  <th className="px-5 py-3 font-medium">员工</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">收集进度</th>
                  <th className="px-5 py-3 font-medium">风险</th>
                  <th className="px-5 py-3 font-medium">培训备注</th>
                  <th className="px-5 py-3 font-medium">责任人</th>
                  <th className="px-5 py-3 font-medium">最近更新</th>
                  <th className="px-5 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {completedDocs.map((emp) => (
                  <EmployeeRow key={emp.id} emp={emp} />
                ))}
              </tbody>
            </table>
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
