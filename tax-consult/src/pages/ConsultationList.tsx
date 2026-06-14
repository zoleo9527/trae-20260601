import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useConsultationStore } from '../stores/consultationStore';
import { useStaffStore } from '../stores/staffStore';
import { useDocumentStore } from '../stores/documentStore';
import type { ConsultationStatus, ResponsibleRole } from '../types';
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_COLORS,
  ROLE_LABELS,
} from '../types';
import StatusBadge from '../components/StatusBadge';
import FilterBar from '../components/FilterBar';
import { formatDate } from '../utils/format';
import {
  Plus,
  Eye,
  ArrowRightCircle,
  RotateCcw,
  FileEdit,
  CheckCircle2,
} from 'lucide-react';

const ALL_STATUSES: ConsultationStatus[] = [
  'pending',
  'accepted',
  'processing',
  'returned',
  'supplementary',
  'reviewing',
  'completed',
];

type FormData = {
  client_name: string;
  client_contact: string;
  consultant_id: string;
  project_manager_id: string;
  client_finance_id: string;
  consultation_type: string;
  description: string;
  remark: string;
};

const EMPTY_FORM: FormData = {
  client_name: '',
  client_contact: '',
  consultant_id: '',
  project_manager_id: '',
  client_finance_id: '',
  consultation_type: '',
  description: '',
  remark: '',
};

export default function ConsultationList() {
  const navigate = useNavigate();
  const { filter, setFilter, resetFilter, getFiltered, addRecord, changeStatus } =
    useConsultationStore();
  const { getByRole, getById } = useStaffStore();
  const getCompletionRate = useDocumentStore((s) => s.getCompletionRate);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const consultants = getByRole('consultant');
  const projectManagers = getByRole('project_manager');
  const clientFinanceStaff = getByRole('client_finance');

  const filtered = useMemo(() => getFiltered(), [getFiltered, filter]);

  const filterFields = useMemo(
    () => [
      { key: 'search', type: 'search' as const, placeholder: '搜索案号/客户/类型...' },
      {
        key: 'status',
        type: 'select' as const,
        placeholder: '全部状态',
        options: ALL_STATUSES.map((s) => ({
          value: s,
          label: CONSULTATION_STATUS_LABELS[s],
        })),
      },
      {
        key: 'consultant_id',
        type: 'select' as const,
        placeholder: '全部顾问',
        options: consultants.map((s) => ({ value: s.id, label: s.name })),
      },
      {
        key: 'project_manager_id',
        type: 'select' as const,
        placeholder: '全部项目经理',
        options: projectManagers.map((s) => ({ value: s.id, label: s.name })),
      },
      {
        key: 'date_range',
        type: 'date_range' as const,
        fromKey: 'date_from',
        toKey: 'date_to',
      },
    ],
    [consultants, projectManagers]
  );

  const staffName = (id: string) => getById(id)?.name ?? '-';

  const handleOpenForm = () => {
    const firstPM = projectManagers[0];
    setForm({ ...EMPTY_FORM, project_manager_id: firstPM?.id ?? '' });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name || !form.consultant_id || !form.project_manager_id) return;
    addRecord({
      client_name: form.client_name,
      client_contact: form.client_contact,
      consultant_id: form.consultant_id,
      project_manager_id: form.project_manager_id,
      client_finance_id: form.client_finance_id,
      consultation_type: form.consultation_type,
      description: form.description,
      remark: form.remark,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleStatusAction = (
    id: string,
    toStatus: ConsultationStatus,
    label: string
  ) => {
    const remark = window.prompt(`${label} - 请输入备注（可选）`) ?? '';
    changeStatus(id, toStatus, 's3', remark);
  };

  const getStatusActions = (
    status: ConsultationStatus,
    id: string
  ) => {
    const actions: { label: string; to: ConsultationStatus; icon: React.ReactNode; color: string }[] = [];

    if (status === 'pending') {
      actions.push({ label: '受理', to: 'accepted', icon: <ArrowRightCircle className="w-3.5 h-3.5" />, color: 'text-blue-600 hover:text-blue-800' });
    } else if (status === 'accepted') {
      actions.push({ label: '开始处理', to: 'processing', icon: <ArrowRightCircle className="w-3.5 h-3.5" />, color: 'text-yellow-600 hover:text-yellow-800' });
    } else if (status === 'processing') {
      actions.push({ label: '退回', to: 'returned', icon: <RotateCcw className="w-3.5 h-3.5" />, color: 'text-red-600 hover:text-red-800' });
      actions.push({ label: '补录', to: 'supplementary', icon: <FileEdit className="w-3.5 h-3.5" />, color: 'text-orange-600 hover:text-orange-800' });
      actions.push({ label: '提交复核', to: 'reviewing', icon: <ArrowRightCircle className="w-3.5 h-3.5" />, color: 'text-purple-600 hover:text-purple-800' });
    } else if (status === 'returned') {
      actions.push({ label: '重新受理', to: 'accepted', icon: <RotateCcw className="w-3.5 h-3.5" />, color: 'text-blue-600 hover:text-blue-800' });
    } else if (status === 'supplementary') {
      actions.push({ label: '提交复核', to: 'reviewing', icon: <ArrowRightCircle className="w-3.5 h-3.5" />, color: 'text-purple-600 hover:text-purple-800' });
    } else if (status === 'reviewing') {
      actions.push({ label: '通过', to: 'completed', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-600 hover:text-green-800' });
      actions.push({ label: '退回', to: 'returned', icon: <RotateCcw className="w-3.5 h-3.5" />, color: 'text-red-600 hover:text-red-800' });
    }

    return actions;
  };

  const getDocDotColor = (consultationId: string) => {
    const { total, confirmed, rate } = getCompletionRate(consultationId);
    if (total === 0) return 'bg-gray-300';
    if (rate === 100) return 'bg-green-500';
    if (confirmed > 0) return 'bg-yellow-400';
    return 'bg-gray-300';
  };

  const selectCls = 'w-full';

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">咨询受理</h1>
        <button
          type="button"
          onClick={handleOpenForm}
          className="btn-primary gap-1"
        >
          <Plus className="w-4 h-4" />
          新建受理
        </button>
      </div>

      <FilterBar
        filter={filter as unknown as Record<string, unknown>}
        setFilter={setFilter as (patch: Partial<Record<string, unknown>>) => void}
        onReset={resetFilter}
        fields={filterFields}
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">客户名称 *</label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">客户联系人</label>
              <input
                type="text"
                value={form.client_contact}
                onChange={(e) => setForm({ ...form, client_contact: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">税务顾问 *</label>
              <select
                value={form.consultant_id}
                onChange={(e) => setForm({ ...form, consultant_id: e.target.value })}
                className={selectCls}
                required
              >
                <option value="">请选择</option>
                {consultants.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">项目经理 *</label>
              <select
                value={form.project_manager_id}
                onChange={(e) => setForm({ ...form, project_manager_id: e.target.value })}
                className={selectCls}
                required
              >
                <option value="">请选择</option>
                {projectManagers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">客户财务</label>
              <select
                value={form.client_finance_id}
                onChange={(e) => setForm({ ...form, client_finance_id: e.target.value })}
                className={selectCls}
              >
                <option value="">请选择</option>
                {clientFinanceStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">咨询类型</label>
              <input
                type="text"
                value={form.consultation_type}
                onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">描述</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full"
                rows={1}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              提交
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>案号</th>
                <th>客户名称</th>
                <th>咨询类型</th>
                <th>状态</th>
                <th>税务顾问</th>
                <th>项目经理</th>
                <th>客户财务</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-8">
                    暂无数据
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const actions = getStatusActions(r.status, r.id);
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${getDocDotColor(r.id)}`}
                            title="资料完成度"
                          />
                          <Link
                            to={`/consultations/${r.id}`}
                            className="text-blue-600 hover:underline font-mono text-xs"
                          >
                            {r.case_number}
                          </Link>
                        </div>
                      </td>
                      <td className="text-xs">{r.client_name}</td>
                      <td className="text-xs">{r.consultation_type}</td>
                      <td>
                        <StatusBadge
                          status={r.status}
                          labels={CONSULTATION_STATUS_LABELS}
                          colors={CONSULTATION_STATUS_COLORS}
                        />
                      </td>
                      <td className="text-xs">{staffName(r.consultant_id)}</td>
                      <td className="text-xs">{staffName(r.project_manager_id)}</td>
                      <td className="text-xs">{staffName(r.client_finance_id)}</td>
                      <td className="text-xs text-gray-500">{formatDate(r.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/consultations/${r.id}`}
                            className="inline-flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-700"
                            title="查看"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {actions.map((a) => (
                            <button
                              key={a.to}
                              type="button"
                              onClick={() => handleStatusAction(r.id, a.to, a.label)}
                              className={`inline-flex items-center gap-0.5 text-xs font-medium ${a.color}`}
                              title={a.label}
                            >
                              {a.icon}
                              <span>{a.label}</span>
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
