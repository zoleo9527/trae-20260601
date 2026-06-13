import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare, Square, ChevronRight, GraduationCap, Check, X, AlertTriangle, Clock, MessageSquare
} from 'lucide-react';
import { useStore, timeAgo, getEmployeeTraining, getEmployeeActiveRisks, getEmployeeLogs, BATCH_ELIGIBLE_STATUSES } from '@/store';
import type { Employee } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import RiskBadge from '@/components/RiskBadge';
import RoleAvatar from '@/components/RoleAvatar';
import { cn } from '@/lib/utils';

const trainingContents = [
  { key: 'safetyTraining', label: '安全培训' },
  { key: 'companyRules', label: '公司规章制度' },
  { key: 'positionSkill', label: '岗位技能培训' },
  { key: 'emergencyProcedure', label: '应急处理流程' },
];

export default function TrainingPage() {
  const {
    employees,
    selectedEmployeeIds,
    toggleEmployeeSelection,
    setEmployeeSelection,
    clearSelection,
    batchSubmitTraining,
    currentUser,
  } = useStore();
  const navigate = useNavigate();
  const [batchRemark, setBatchRemark] = useState('');
  const [showBatchPanel, setShowBatchPanel] = useState(false);

  const trainingEmployees = useMemo(() => {
    return employees
      .filter((e) =>
        ['pending_training', 'in_training', 'training_exception'].includes(e.currentStatus)
      )
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [employees]);

  const pendingEmployees = trainingEmployees.filter(
    (e) => e.currentStatus === 'pending_training'
  );
  const inTrainingEmployees = trainingEmployees.filter(
    (e) => e.currentStatus === 'in_training'
  );
  const exceptionEmployees = trainingEmployees.filter(
    (e) => e.currentStatus === 'training_exception'
  );

  const selectedEmployees = trainingEmployees.filter((e) =>
    selectedEmployeeIds.includes(e.id)
  );

  const batchEligibleEmployees = trainingEmployees.filter((e) =>
    BATCH_ELIGIBLE_STATUSES.includes(e.currentStatus)
  );

  const ineligibleSelected = selectedEmployees.filter(
    (e) => !BATCH_ELIGIBLE_STATUSES.includes(e.currentStatus)
  ).length;

  const handleSelectAll = () => {
    const allEligibleIds = batchEligibleEmployees.map((e) => e.id);
    if (selectedEmployeeIds.length === allEligibleIds.length && allEligibleIds.length > 0) {
      clearSelection();
    } else {
      setEmployeeSelection(allEligibleIds);
    }
  };

  const handleBatchSubmit = () => {
    if (selectedEmployeeIds.length === 0) return;
    batchSubmitTraining(selectedEmployeeIds, batchRemark || undefined);
    setBatchRemark('');
    setShowBatchPanel(false);
  };

  const canEdit = currentUser.role === 'site_supervisor' || currentUser.role === 'recruiter';

  function EmployeeRow({ emp }: { emp: Employee }) {
  const training = getEmployeeTraining(emp.id);
  const risks = getEmployeeActiveRisks(emp.id);
  const logs = getEmployeeLogs(emp.id);
  const latestLog = logs[0];
  const isSelected = selectedEmployeeIds.includes(emp.id);
  const canSelect = BATCH_ELIGIBLE_STATUSES.includes(emp.currentStatus);

  return (
    <tr
      key={emp.id}
      className={cn(
        'hover:bg-ink-50/50 transition-colors',
        isSelected && 'bg-brand-50/60'
      )}
    >
      <td className="px-5 py-4">
        {canSelect && canEdit && (
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
        {training ? (
          <div className="flex flex-wrap gap-1">
          {trainingContents.map((tc) => (
            <span
              key={tc.key}
              className={cn(
                'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded',
                training[tc.key as keyof typeof training]
                  ? 'bg-emerald/10 text-emerald'
                  : 'bg-ink-100 text-ink-400'
              )}
            >
              {training[tc.key as keyof typeof training] ? (
                <Check size={10} />
              ) : (
                <X size={10} />
              )}
              {tc.label.slice(0, 2)}
            </span>
          ))}
        </div>
        ) : (
          <span className="text-xs text-ink-400">未开始</span>
        )}
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
        <RoleAvatar role={emp.currentOwner} size="sm" />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <Clock size={12} />
          {latestLog?.remark && (
            <MessageSquare size={12} className="text-brand-500" />
          )}
          {timeAgo(emp.updatedAt)}
        </div>
        {latestLog?.remark && (
          <div className="text-[11px] text-ink-500 mt-0.5 line-clamp-1">
            {latestLog.remark}
          </div>
        )}
      </td>
      <td className="px-5 py-4">
        <Link
          to={`/training/${emp.id}`}
          className="p-1.5 rounded hover:bg-brand-50 text-ink-400 hover:text-brand-600 transition-colors"
        >
          <ChevronRight size={16} />
        </Link>
      </td>
    </tr>
  );
}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-ink-900">入场培训处理</h1>
          <p className="text-sm text-ink-500 mt-1">
            共 {trainingEmployees.length} 名员工待处理
          </p>
        </div>
        {canEdit && trainingEmployees.length > 0 && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowBatchPanel(!showBatchPanel)}
          >
            <GraduationCap size={16} />
            批量处理 {selectedEmployeeIds.length > 0 && `(${selectedEmployeeIds.length})`}
          </button>
        )}
      </div>

      {showBatchPanel && (
        <div className="card p-4 border-l-4 border-l-brand-600 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <label className="label">批量备注（可选）</label>
              <input
                type="text"
                className="field"
                placeholder="例如：今日下午集体培训通过"
                value={batchRemark}
                onChange={(e) => setBatchRemark(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSelectAll}
              >
                {selectedEmployeeIds.length === batchEligibleEmployees.length && batchEligibleEmployees.length > 0 ? (
                  <>
                    <X size={14} /> 取消全选
                  </>
                ) : (
                  <>
                    <CheckSquare size={14} /> 全选可批量人员
                  </>
                )}
              </button>
              <button
                className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBatchSubmit}
                disabled={selectedEmployeeIds.length - ineligibleSelected === 0}
              >
                <Check size={14} />
                确认批量通过
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowBatchPanel(false)}
              >
                取消
              </button>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-ink-500">
            批量仅作用于「待入场培训 / 培训中」人员，培训异常需个案处理。
            可批量人员：<span className="text-brand-700 font-medium">{batchEligibleEmployees.length}</span> 人
            {ineligibleSelected > 0 && (
              <span className="text-rose ml-2">
                已选择 {ineligibleSelected} 名异常人员，将自动跳过
              </span>
            )}
          </div>
          {selectedEmployeeIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-ink-100">
              <div className="text-xs text-ink-500 mb-2">已选择 {selectedEmployeeIds.length} 人：</div>
              <div className="flex flex-wrap gap-2">
                {selectedEmployees.map((e) => {
                  const eligible = BATCH_ELIGIBLE_STATUSES.includes(e.currentStatus);
                  return (
                    <span
                      key={e.id}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs",
                        eligible ? "bg-brand-50 text-brand-700" : "bg-rose/10 text-rose line-through"
                      )}
                    >
                      {e.name}
                      {!eligible && <span className="text-[10px]">（不可批量）</span>}
                      <button
                        className="ml-1 hover:text-rose"
                        onClick={() => toggleEmployeeSelection(e.id)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {exceptionEmployees.length > 0 && (
        <div className="card p-5 border-l-4 border-l-rose">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose mt-0.5" />
            <div className="flex-1">
            <div className="font-medium text-ink-800 text-sm">培训异常提醒</div>
            <div className="text-xs text-ink-500 mt-1">
              有 {exceptionEmployees.length} 名员工处于培训异常状态，需要单独处理
            </div>
          </div>
          <div className="flex gap-2">
            {exceptionEmployees.slice(0, 3).map((e) => (
              <Link
                key={e.id}
                to={`/training/${e.id}`}
                className="text-xs text-rose hover:underline"
              >
                {e.name}
              </Link>
            ))}
          </div>
        </div>
        </div>
      )}

      {pendingEmployees.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 bg-brand-50/50">
            <h2 className="font-serif font-semibold text-ink-800">
              待入场培训
              <span className="ml-2 text-xs font-normal text-ink-500">
                {pendingEmployees.length} 人
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
                  <th className="px-5 py-3 font-medium">培训内容</th>
                  <th className="px-5 py-3 font-medium">风险</th>
                  <th className="px-5 py-3 font-medium">责任人</th>
                  <th className="px-5 py-3 font-medium">最近更新</th>
                  <th className="px-5 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {pendingEmployees.map((emp) => (
                  <EmployeeRow key={emp.id} emp={emp} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inTrainingEmployees.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 bg-amber/5">
            <h2 className="font-serif font-semibold text-ink-800">
              培训中
              <span className="ml-2 text-xs font-normal text-ink-500">
                {inTrainingEmployees.length} 人
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
                  <th className="px-5 py-3 font-medium">培训内容</th>
                  <th className="px-5 py-3 font-medium">风险</th>
                  <th className="px-5 py-3 font-medium">责任人</th>
                  <th className="px-5 py-3 font-medium">最近更新</th>
                  <th className="px-5 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {inTrainingEmployees.map((emp) => (
                  <EmployeeRow key={emp.id} emp={emp} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {exceptionEmployees.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 bg-rose/5">
            <h2 className="font-serif font-semibold text-ink-800">
              培训异常
              <span className="ml-2 text-xs font-normal text-ink-500">
                {exceptionEmployees.length} 人
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
                  <th className="px-5 py-3 font-medium">培训内容</th>
                  <th className="px-5 py-3 font-medium">风险</th>
                  <th className="px-5 py-3 font-medium">责任人</th>
                  <th className="px-5 py-3 font-medium">最近更新</th>
                  <th className="px-5 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {exceptionEmployees.map((emp) => (
                  <EmployeeRow key={emp.id} emp={emp} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {trainingEmployees.length === 0 && (
        <div className="card p-12 text-center">
          <GraduationCap size={48} className="mx-auto text-ink-300" />
          <div className="mt-4 text-ink-500">暂无待培训员工</div>
        </div>
      )}
    </div>
  );
}
