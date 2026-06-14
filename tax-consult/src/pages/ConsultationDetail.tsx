import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConsultationStore } from '../stores/consultationStore';
import { useStaffStore } from '../stores/staffStore';
import { useDocumentStore } from '../stores/documentStore';
import type { ConsultationStatus, DocumentStatus, ResponsibleRole } from '../types';
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_COLORS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  ROLE_LABELS,
} from '../types';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import { formatDateTime, formatDate } from '../utils/format';
import { genId } from '../utils/id';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  FileEdit,
  Plus,
  Trash2,
  Upload,
  Send,
} from 'lucide-react';

type DocFormData = {
  document_name: string;
  document_type: string;
  responsible_role: ResponsibleRole;
  responsible_id: string;
  due_date: string;
};

const EMPTY_DOC_FORM: DocFormData = {
  document_name: '',
  document_type: '',
  responsible_role: 'consultant',
  responsible_id: '',
  due_date: '',
};

const FLOW_STEPS: { status: ConsultationStatus; label: string }[] = [
  { status: 'pending', label: '待受理' },
  { status: 'accepted', label: '已受理' },
  { status: 'processing', label: '处理中' },
  { status: 'reviewing', label: '复核中' },
  { status: 'completed', label: '已完成' },
];

const STEP_INDEX: Record<ConsultationStatus, number> = {
  pending: 0,
  accepted: 1,
  processing: 2,
  returned: 3,
  supplementary: 3,
  reviewing: 4,
  completed: 5,
};

export default function ConsultationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getById = useConsultationStore((s) => s.getById);
  const changeStatus = useConsultationStore((s) => s.changeStatus);
  const staffGetById = useStaffStore((s) => s.getById);
  const staffGetByRole = useStaffStore((s) => s.getByRole);
  const docGetByConsultation = useDocumentStore((s) => s.getByConsultation);
  const docChangeStatus = useDocumentStore((s) => s.changeStatus);
  const docAddItem = useDocumentStore((s) => s.addItem);

  const [docForm, setDocForm] = useState<DocFormData>(EMPTY_DOC_FORM);
  const [showDocForm, setShowDocForm] = useState(false);

  const record = id ? getById(id) : undefined;

  const documents = useMemo(
    () => (id ? docGetByConsultation(id) : []),
    [id, docGetByConsultation]
  );

  const filteredStaff = useMemo(
    () => staffGetByRole(docForm.responsible_role),
    [docForm.responsible_role, staffGetByRole]
  );

  if (!record) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>未找到该咨询记录</p>
        <button
          type="button"
          onClick={() => navigate('/consultations')}
          className="mt-2 text-blue-600 hover:underline text-sm"
        >
          返回列表
        </button>
      </div>
    );
  }

  const staffName = (sid: string) => staffGetById(sid)?.name ?? '-';
  const currentStepIndex = STEP_INDEX[record.status];

  const isStepReached = (stepStatus: ConsultationStatus) => {
    if (stepStatus === 'returned' || stepStatus === 'supplementary') {
      return STEP_INDEX[record.status] >= STEP_INDEX[stepStatus] &&
        (record.status === stepStatus || STEP_INDEX[record.status] > STEP_INDEX[stepStatus]);
    }
    return STEP_INDEX[record.status] >= STEP_INDEX[stepStatus];
  };

  const isBranchActive = record.status === 'returned' || record.status === 'supplementary';

  const handleConsultationAction = (toStatus: ConsultationStatus, label: string) => {
    const remark = window.prompt(`${label} - 请输入备注（可选）`) ?? '';
    changeStatus(record.id, toStatus, 's3', remark);
  };

  const handleDocStatusAction = (
    docId: string,
    toStatus: DocumentStatus,
    label: string
  ) => {
    const remark = window.prompt(`${label} - 请输入备注（可选）`) ?? '';
    docChangeStatus(docId, toStatus, 's3', remark);
  };

  const handleDocFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.document_name || !docForm.responsible_id || !docForm.due_date) return;
    docAddItem({
      consultation_id: record.id,
      document_name: docForm.document_name,
      document_type: docForm.document_type,
      responsible_role: docForm.responsible_role,
      responsible_id: docForm.responsible_id,
      due_date: docForm.due_date,
      remark: '',
    });
    setDocForm(EMPTY_DOC_FORM);
    setShowDocForm(false);
  };

  const getConsultationActions = () => {
    const status = record.status;
    const actions: { label: string; to: ConsultationStatus; icon: React.ReactNode; color: string }[] = [];

    if (status === 'pending') {
      actions.push({ label: '受理', to: 'accepted', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-blue-600 hover:bg-blue-700 text-white' });
    } else if (status === 'accepted') {
      actions.push({ label: '开始处理', to: 'processing', icon: <Send className="w-4 h-4" />, color: 'bg-yellow-600 hover:bg-yellow-700 text-white' });
    } else if (status === 'processing') {
      actions.push({ label: '退回', to: 'returned', icon: <RotateCcw className="w-4 h-4" />, color: 'bg-red-600 hover:bg-red-700 text-white' });
      actions.push({ label: '补录', to: 'supplementary', icon: <FileEdit className="w-4 h-4" />, color: 'bg-orange-600 hover:bg-orange-700 text-white' });
      actions.push({ label: '提交复核', to: 'reviewing', icon: <Send className="w-4 h-4" />, color: 'bg-purple-600 hover:bg-purple-700 text-white' });
    } else if (status === 'returned') {
      actions.push({ label: '重新受理', to: 'accepted', icon: <RotateCcw className="w-4 h-4" />, color: 'bg-blue-600 hover:bg-blue-700 text-white' });
    } else if (status === 'supplementary') {
      actions.push({ label: '提交复核', to: 'reviewing', icon: <Send className="w-4 h-4" />, color: 'bg-purple-600 hover:bg-purple-700 text-white' });
    } else if (status === 'reviewing') {
      actions.push({ label: '通过', to: 'completed', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-green-600 hover:bg-green-700 text-white' });
      actions.push({ label: '退回', to: 'returned', icon: <RotateCcw className="w-4 h-4" />, color: 'bg-red-600 hover:bg-red-700 text-white' });
    }

    return actions;
  };

  const getDocActions = (docStatus: DocumentStatus, docId: string) => {
    const actions: { label: string; to: DocumentStatus; icon: React.ReactNode; color: string }[] = [];

    if (docStatus === 'not_submitted') {
      actions.push({ label: '标记提交', to: 'submitted', icon: <Upload className="w-3.5 h-3.5" />, color: 'text-blue-600 hover:text-blue-800' });
    } else if (docStatus === 'submitted') {
      actions.push({ label: '确认', to: 'confirmed', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-600 hover:text-green-800' });
      actions.push({ label: '退回', to: 'returned', icon: <RotateCcw className="w-3.5 h-3.5" />, color: 'text-red-600 hover:text-red-800' });
    } else if (docStatus === 'returned') {
      actions.push({ label: '重新提交', to: 'submitted', icon: <Upload className="w-3.5 h-3.5" />, color: 'text-blue-600 hover:text-blue-800' });
    }

    return actions;
  };

  const actions = getConsultationActions();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/consultations')}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 font-mono">{record.case_number}</h1>
        <StatusBadge
          status={record.status}
          labels={CONSULTATION_STATUS_LABELS}
          colors={CONSULTATION_STATUS_COLORS}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[60%] space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">流程进度</h2>
            <div className="flex items-center">
              {FLOW_STEPS.map((step, idx) => {
                const reached = isStepReached(step.status);
                const isCurrent = record.status === step.status;

                if (idx === 3) {
                  return (
                    <div key="branch" className="flex items-center">
                      <div className="flex flex-col items-center mx-1">
                        {['returned', 'supplementary'].map((branch) => {
                          const bStatus = branch as ConsultationStatus;
                          const branchReached = isBranchActive && record.status === bStatus;
                          const branchPast = currentStepIndex > STEP_INDEX[bStatus];
                          const active = branchReached || branchPast;
                          return (
                            <div key={branch} className="flex flex-col items-center my-0.5">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                  active
                                    ? 'bg-brand-500 border-brand-500 text-white'
                                    : 'bg-white border-gray-300 text-gray-400'
                                }`}
                              >
                                {active ? '✓' : idx + 1}
                              </div>
                              <span
                                className={`text-[10px] mt-0.5 whitespace-nowrap ${
                                  active ? 'text-brand-600 font-medium' : 'text-gray-400'
                                }`}
                              >
                                {CONSULTATION_STATUS_LABELS[bStatus]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {idx < FLOW_STEPS.length - 1 && (
                        <div
                          className={`h-px w-6 ${
                            currentStepIndex > STEP_INDEX[step.status]
                              ? 'bg-brand-500'
                              : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                  );
                }

                return (
                  <div key={step.status} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          reached
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {reached ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-0.5 whitespace-nowrap ${
                          isCurrent
                            ? 'text-brand-600 font-semibold'
                            : reached
                            ? 'text-brand-600 font-medium'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < FLOW_STEPS.length - 1 && (
                      <div
                        className={`h-px w-6 ${
                          reached && idx + 1 <= currentStepIndex
                            ? 'bg-brand-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">基本信息</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500">客户名称：</span>
                <span className="text-gray-900">{record.client_name}</span>
              </div>
              <div>
                <span className="text-gray-500">联系人：</span>
                <span className="text-gray-900">{record.client_contact || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">咨询类型：</span>
                <span className="text-gray-900">{record.consultation_type || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">描述：</span>
                <span className="text-gray-900">{record.description || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">备注：</span>
                <span className="text-gray-900">{record.remark || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">创建时间：</span>
                <span className="text-gray-900">{formatDateTime(record.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">更新时间：</span>
                <span className="text-gray-900">{formatDateTime(record.updated_at)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 mb-2">负责人员</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{ROLE_LABELS.consultant}：</span>
                  <span className="text-gray-900">{staffName(record.consultant_id)}</span>
                </div>
                <div>
                  <span className="text-gray-500">{ROLE_LABELS.project_manager}：</span>
                  <span className="text-gray-900">{staffName(record.project_manager_id)}</span>
                </div>
                <div>
                  <span className="text-gray-500">{ROLE_LABELS.client_finance}：</span>
                  <span className="text-gray-900">{staffName(record.client_finance_id)}</span>
                </div>
              </div>
            </div>
          </div>

          {actions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {actions.map((a) => (
                <button
                  key={a.to}
                  type="button"
                  onClick={() => handleConsultationAction(a.to, a.label)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${a.color}`}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-[40%] space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">状态历史</h2>
            <StatusTimeline entries={record.status_history} />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">资料清单</h2>
              <button
                type="button"
                onClick={() => setShowDocForm(!showDocForm)}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                添加资料
              </button>
            </div>

            {showDocForm && (
              <form onSubmit={handleDocFormSubmit} className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">资料名称 *</label>
                    <input
                      type="text"
                      value={docForm.document_name}
                      onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })}
                      className="w-full text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">资料类型</label>
                    <input
                      type="text"
                      value={docForm.document_type}
                      onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">负责角色</label>
                    <select
                      value={docForm.responsible_role}
                      onChange={(e) =>
                        setDocForm({ ...docForm, responsible_role: e.target.value as ResponsibleRole, responsible_id: '' })
                      }
                      className="w-full text-sm"
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">负责人 *</label>
                    <select
                      value={docForm.responsible_id}
                      onChange={(e) => setDocForm({ ...docForm, responsible_id: e.target.value })}
                      className="w-full text-sm"
                      required
                    >
                      <option value="">请选择</option>
                      {filteredStaff.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">截止日期 *</label>
                    <input
                      type="date"
                      value={docForm.due_date}
                      onChange={(e) => setDocForm({ ...docForm, due_date: e.target.value })}
                      className="w-full text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowDocForm(false); setDocForm(EMPTY_DOC_FORM); }}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    取消
                  </button>
                  <button type="submit" className="btn-primary text-xs px-3 py-1">
                    添加
                  </button>
                </div>
              </form>
            )}

            {documents.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">暂无资料</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const docActions = getDocActions(doc.status, doc.id);
                  return (
                    <div
                      key={doc.id}
                      className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{doc.document_name}</span>
                        <StatusBadge
                          status={doc.status}
                          labels={DOCUMENT_STATUS_LABELS}
                          colors={DOCUMENT_STATUS_COLORS}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{doc.document_type}</span>
                        <span>{ROLE_LABELS[doc.responsible_role]}：{staffName(doc.responsible_id)}</span>
                        <span>截止：{formatDate(doc.due_date)}</span>
                        {doc.submitted_at && <span>提交：{formatDate(doc.submitted_at)}</span>}
                      </div>
                      {docActions.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {docActions.map((a) => (
                            <button
                              key={a.to}
                              type="button"
                              onClick={() => handleDocStatusAction(doc.id, a.to, a.label)}
                              className={`inline-flex items-center gap-0.5 text-xs font-medium ${a.color}`}
                            >
                              {a.icon}
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
