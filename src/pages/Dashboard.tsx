import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Stethoscope,
  Flame,
  Truck,
  LogOut,
  User,
  Search,
  Clock,
  FileText,
  RefreshCw,
  History,
  ListTodo,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  STATUS_LABELS,
  ROLE_LABELS,
  ROLE_TODO_STATUSES,
} from '../../shared/types';
import type { Prescription, PrescriptionStatus, RoleTodoCount } from '../../shared/types';
import { formatRelativeTime } from '../utils/format';
import { cn } from '../lib/utils';

const roleIcon: Record<string, React.ReactNode> = {
  PHARMACIST: <Stethoscope className="w-5 h-5" />,
  DECOCTION_STAFF: <Flame className="w-5 h-5" />,
  DELIVERY_STAFF: <Truck className="w-5 h-5" />,
};

const roleColor: Record<string, string> = {
  PHARMACIST: 'from-sky-500 to-sky-600',
  DECOCTION_STAFF: 'from-orange-500 to-orange-600',
  DELIVERY_STAFF: 'from-teal-500 to-teal-600',
};

const statusCardConfig: {
  status: PrescriptionStatus;
  label: string;
  color: string;
}[] = [
  { status: 'PENDING_REVIEW', label: '待审核', color: 'bg-amber-500' },
  { status: 'PENDING_DECOCTION', label: '待煎药', color: 'bg-orange-500' },
  { status: 'PENDING_DELIVERY', label: '待配送', color: 'bg-indigo-500' },
  { status: 'OUT_FOR_DELIVERY', label: '配送中', color: 'bg-teal-500' },
  { status: 'RETURNED', label: '已退回', color: 'bg-red-500' },
];

type TabType = 'todo' | 'history';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentRole, operatorName, todoCount, setTodoCount, reset } = useAppStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<TabType>('todo');

  useEffect(() => {
    if (!currentRole) {
      navigate('/');
      return;
    }
    loadData();
  }, [currentRole, navigate, activeTab]);

  const loadData = async () => {
    if (!currentRole) return;
    setLoading(true);
    try {
      let todos: Prescription[];
      if (activeTab === 'todo') {
        todos = await api.getPrescriptionsByRole(currentRole);
      } else {
        todos = await api.getHistoryByRole(currentRole);
      }
      setPrescriptions(todos);
      if (activeTab === 'todo') {
        const count = await api.getTodoCount(currentRole);
        setTodoCount(count);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    reset();
    navigate('/');
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchSearch =
      p.prescriptionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientName.includes(searchQuery) ||
      p.diagnosis.includes(searchQuery);
    const matchStatus = statusFilter === 'ALL' || p.currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const availableStatuses = activeTab === 'todo'
    ? ROLE_TODO_STATUSES[currentRole!] || []
    : [];

  const allStatusesInList = [...new Set(prescriptions.map((p) => p.currentStatus))];

  if (!currentRole) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br text-white',
                  roleColor[currentRole]
                )}
              >
                {roleIcon[currentRole]}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {activeTab === 'todo' ? '待办看板' : '历史记录'}
                </h1>
                <p className="text-sm text-slate-500">
                  {ROLE_LABELS[currentRole]} · {operatorName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">{operatorName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('todo'); setStatusFilter('ALL'); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
              activeTab === 'todo'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <ListTodo className="w-4 h-4" />
            待办事项
          </button>
          <button
            onClick={() => { setActiveTab('history'); setStatusFilter('ALL'); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
              activeTab === 'history'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <History className="w-4 h-4" />
            历史记录
          </button>
        </div>

        {activeTab === 'todo' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {statusCardConfig.map((config) => {
              const count = todoCount ? (todoCount[config.status as keyof RoleTodoCount] as number ?? 0) : 0;
              const isRelevant = availableStatuses.includes(config.status);

              if (!isRelevant) return null;

              return (
                <div
                  key={config.status}
                  className={cn(
                    'bg-white rounded-xl border p-4 transition-all',
                    'border-slate-200 hover:shadow-md cursor-pointer',
                    statusFilter === config.status && 'ring-2 ring-teal-500 border-teal-500'
                  )}
                  onClick={() =>
                    setStatusFilter(statusFilter === config.status ? 'ALL' : config.status)
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">{config.label}</span>
                    <div className={cn('w-2.5 h-2.5 rounded-full', config.color)} />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{count}</div>
                  <div className="text-xs text-slate-400 mt-1">点击筛选</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">
                {activeTab === 'todo' ? '我的待办' : '历史记录'}
                <span className="ml-2 text-sm font-normal text-slate-400">
                  共 {filteredPrescriptions.length} 条
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索处方号、患者姓名、诊断"
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-72 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
              {activeTab === 'todo' && availableStatuses.length > 0 && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  <option value="ALL">全部状态</option>
                  {availableStatuses.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              )}
              {activeTab === 'history' && allStatusesInList.length > 0 && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  <option value="ALL">全部状态</option>
                  {allStatusesInList.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={loadData}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="刷新"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-2 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>加载中...</span>
              </div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText className="w-12 h-12 mb-3" />
              <p className="text-sm">{activeTab === 'todo' ? '暂无待办处方' : '暂无历史记录'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      处方编号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      患者信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      诊断
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrescriptions.map((prescription, index) => (
                    <tr
                      key={prescription.id}
                      className={cn(
                        'hover:bg-slate-50 transition-colors',
                        index % 2 === 1 && 'bg-slate-50/30'
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {prescription.prescriptionNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {prescription.patientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {prescription.patientGender} · {prescription.patientAge}岁
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">{prescription.diagnosis}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={prescription.currentStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {formatRelativeTime(prescription.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/prescription/${prescription.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors font-medium"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
