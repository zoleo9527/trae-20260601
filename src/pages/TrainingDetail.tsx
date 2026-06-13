import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Check, AlertTriangle, MessageSquare, User, Building, Calendar, FileText
} from 'lucide-react';
import { useStore, formatDateTime, getEmployeeTraining, getEmployeeLogs, getEmployeeActiveRisks, getEmployeeAllRisks, getEmployeeDocuments } from '@/store';
import { STATUS_LABEL, ROLE_LABEL } from '@/constants';
import type { TrainingInput, RiskFlagType } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import RiskBadge from '@/components/RiskBadge';
import RoleAvatar from '@/components/RoleAvatar';
import { cn } from '@/lib/utils';

const trainingContents = [
  { key: 'safetyTraining', label: '安全培训', desc: '安全生产规范、防护用品使用' },
  { key: 'companyRules', label: '公司规章制度', desc: '考勤制度、奖惩条例' },
  { key: 'positionSkill', label: '岗位技能培训', desc: '岗位操作流程、质量标准' },
  { key: 'emergencyProcedure', label: '应急处理流程', desc: '火灾、工伤、突发事件处理' },
];

const riskTypes: { value: RiskFlagType; label: string; color: string }[] = [
  { value: 'temporary_absence', label: '临时缺岗', color: 'text-amber' },
  { value: 'attendance_dispute', label: '考勤争议', color: 'text-amber' },
  { value: 'salary_deduction', label: '工资扣款', color: 'text-rose' },
];

export default function TrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    employees,
    submitTraining,
    updateEmployeeStatus,
    addRiskFlag,
    currentUser,
  } = useStore();

  const employee = employees.find((e) => e.id === id);
  const training = getEmployeeTraining(id!);
  const logs = getEmployeeLogs(id!);
  const activeRisks = getEmployeeActiveRisks(id!);
  const allRisks = getEmployeeAllRisks(id!);
  const docs = getEmployeeDocuments(id!);

  const [form, setForm] = useState<TrainingInput>({
    safetyTraining: training?.safetyTraining ?? false,
    companyRules: training?.companyRules ?? false,
    positionSkill: training?.positionSkill ?? false,
    emergencyProcedure: training?.emergencyProcedure ?? false,
    trainingResult: training?.trainingResult === 'failed' ? 'failed' : 'passed',
    trainingRemark: training?.trainingRemark ?? '',
  });

  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskType, setRiskType] = useState<RiskFlagType>('temporary_absence');
  const [riskDesc, setRiskDesc] = useState('');

  const canEdit = currentUser.role === 'site_supervisor';
  const allChecked = useMemo(
    () => form.safetyTraining && form.companyRules && form.positionSkill && form.emergencyProcedure,
    [form]
  );

  if (!employee) {
    return (
      <div className="card p-12 text-center">
        <div className="text-ink-500">未找到该员工信息</div>
        <Link to="/training" className="btn btn-primary btn-sm mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!canEdit) return;
    submitTraining(id!, form, form.trainingRemark);
    if (form.trainingResult === 'passed') {
      navigate(`/documents/${id}`);
    } else {
      navigate('/training');
    }
  };

  const handleStartTraining = () => {
    if (!canEdit) return;
    updateEmployeeStatus(id!, 'in_training', '已安排入场培训');
  };

  const handleAddRisk = () => {
    if (!riskDesc.trim()) return;
    addRiskFlag(id!, riskType, riskDesc);
    setShowRiskModal(false);
    setRiskDesc('');
  };

  const trainingLogs = logs.filter((l) => l.fromStatus === 'in_training' || l.toStatus === 'in_training' || l.fromStatus === 'pending_training');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/training')}>
          <ArrowLeft size={16} />
          返回
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-semibold text-ink-900">
            {employee.name} - 入场培训
          </h1>
          <p className="text-sm text-ink-500">
            {employee.dispatchCompany} · {employee.position}
          </p>
        </div>
        <StatusBadge status={employee.currentStatus} />
      </div>

      {employee.currentStatus === 'pending_training' && canEdit && (
        <div className="card p-5 border-l-4 border-l-brand-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-ink-800">该员工尚未开始培训</div>
              <div className="text-xs text-ink-500 mt-1">
                点击下方按钮安排入场培训，开始处理流程
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleStartTraining}>
              开始培训
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-semibold text-ink-800">培训内容确认</h2>
              {training?.trainingResult === 'passed' && (
                <span className="text-xs text-emerald flex items-center gap-1">
                  <Check size={12} />
                  已完成
                </span>
              )}
            </div>

            <div className="space-y-4">
              {trainingContents.map((tc) => (
                <div
                  key={tc.key}
                  className={cn(
                    'p-4 rounded-[4px] border transition-colors',
                    form[tc.key as keyof TrainingInput]
                      ? 'bg-emerald/5 border-emerald/20'
                      : 'bg-white border-ink-100'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      className={cn(
                        'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
                        form[tc.key as keyof TrainingInput]
                          ? 'bg-emerald border-emerald'
                          : 'border-ink-300',
                        !canEdit && 'cursor-not-allowed opacity-60'
                      )}
                      onClick={() => {
                        if (!canEdit) return;
                        setForm((f) => ({
                          ...f,
                          [tc.key]: !f[tc.key as keyof TrainingInput],
                        }));
                      }}
                    >
                      {form[tc.key as keyof TrainingInput] && (
                        <Check size={12} className="text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium text-ink-800 text-sm">
                        {tc.label}
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        {tc.desc}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="label">培训结果</label>
                <div className="flex gap-3">
                  {(['passed', 'failed'] as const).map((result) => (
                    <button
                      key={result}
                      className={cn(
                        'flex-1 p-3 rounded-[4px] border-2 text-sm font-medium transition-all',
                        form.trainingResult === result
                          ? result === 'passed'
                            ? 'bg-emerald/10 border-emerald text-emerald'
                            : 'bg-rose/10 border-rose text-rose'
                          : 'bg-white border-ink-200 text-ink-600 hover:border-ink-300',
                        !canEdit && 'cursor-not-allowed opacity-60'
                      )}
                      onClick={() => {
                        if (!canEdit) return;
                        setForm((f) => ({ ...f, trainingResult: result }));
                      }}
                    >
                      {result === 'passed' ? '培训通过' : '培训未通过'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  <MessageSquare size={14} className="inline mr-1" />
                  培训备注
                  <span className="text-ink-400 font-normal ml-1">
                    （此备注将自动传递到证件收集阶段）
                  </span>
                </label>
                <textarea
                  className="field min-h-[80px]"
                  placeholder="例如：培训表现良好，需注意... 特别提醒健康证即将到期"
                  value={form.trainingRemark}
                  onChange={(e) => setForm((f) => ({ ...f, trainingRemark: e.target.value }))}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {canEdit &&
              employee.currentStatus !== 'pending_training' && (
                <div className="mt-6 pt-6 border-t border-ink-100 flex justify-end gap-3">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/training')}>
                    取消
                  </button>
                  <button
                    className={cn(
                      'btn btn-sm',
                      form.trainingResult === 'passed' && !allChecked
                        ? 'btn-secondary'
                        : 'btn-primary',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    onClick={handleSubmit}
                    disabled={form.trainingResult === 'passed' && !allChecked}
                  >
                    <Check size={14} />
                    {form.trainingResult === 'passed'
                      ? allChecked
                        ? '确认培训通过，进入证件收集'
                        : '请完成全部勾选全部培训内容'
                      : '标记培训未通过'}
                  </button>
                </div>
              )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-semibold text-ink-800">风险标记</h2>
              {canEdit && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRiskModal(true)}
                >
                  <AlertTriangle size={14} />
                  标记风险
                </button>
              )}
            </div>

            {activeRisks.length > 0 ? (
              <div className="space-y-3">
                {activeRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className={cn(
                      'p-4 rounded-[4px] border-l-4',
                      risk.flagType === 'salary_deduction'
                        ? 'border-l-rose bg-rose/5'
                        : 'border-l-amber bg-amber/5'
                    )}
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
                暂无风险标记
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

          {training?.trainingRemark && (
            <div className="card p-5 border-l-4 border-l-brand-600">
              <h3 className="font-serif font-semibold text-ink-800 mb-2">
                培训备注（将传递到证件收集）
              </h3>
              <div className="text-sm text-ink-600 bg-ink-50 p-3 rounded">
                {training.trainingRemark}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-serif font-semibold text-ink-800 mb-4">
              状态变更记录
            </h3>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-ink-200" />
              <div className="space-y-4">
                {trainingLogs.map((log, idx) => (
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
                        <div className="text-xs text-ink-600 mt-0.5">
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

      {showRiskModal && (
        <>
          <div
            className="fixed inset-0 bg-ink-900/40 z-30"
            onClick={() => setShowRiskModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[6px] shadow-card-hover z-40 p-6 animate-slide-up">
            <h3 className="font-serif font-semibold text-ink-800 mb-4">
              标记风险
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">风险类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {riskTypes.map((rt) => (
                    <button
                      key={rt.value}
                      className={cn(
                        'p-2 rounded-[4px] border-2 text-xs font-medium text-center transition-colors',
                        riskType === rt.value
                          ? `${rt.color} border-current bg-current/10`
                          : 'border-ink-200 text-ink-600 hover:border-ink-300'
                      )}
                      onClick={() => setRiskType(rt.value)}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">风险描述</label>
                <textarea
                  className="field min-h-[80px]"
                  placeholder="请详细描述风险情况..."
                  value={riskDesc}
                  onChange={(e) => setRiskDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowRiskModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddRisk}
                disabled={!riskDesc.trim()}
              >
                确认标记
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
