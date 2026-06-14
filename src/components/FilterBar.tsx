import { useAppStore } from '../store/appStore';
import type { ConsultationStatus, UserRole, QueryFilter } from '../types';
import { Search, Filter, X, RefreshCw, User, Clock, AlertTriangle, XCircle, ListChecks, CheckCircle, Inbox } from 'lucide-react';
import { TAX_TYPES, PRIORITY_LABELS } from '../types';
import { useMemo } from 'react';

const STATUS_OPTIONS: ConsultationStatus[] = [
  '待受理',
  '已受理',
  '待补录',
  '补录中',
  '待复核',
  '复核通过',
  '已退回',
  '资料清单完成',
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'consultant', label: '税务顾问' },
  { value: 'project_manager', label: '项目经理' },
  { value: 'client_finance', label: '客户财务' },
];

interface QuickFilter {
  key: string;
  label: string;
  icon: any;
  color: string;
  getFilter: (currentUser: any) => Partial<QueryFilter>;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    key: 'my_pending',
    label: '我的待办',
    icon: Inbox,
    color: 'bg-blue-600',
    getFilter: (user) => ({ currentHandler: user?.name || undefined }),
  },
  {
    key: 'pending_accept',
    label: '待受理',
    icon: Clock,
    color: 'bg-gray-600',
    getFilter: () => ({ status: '待受理' }),
  },
  {
    key: 'supplement',
    label: '补录中',
    icon: ListChecks,
    color: 'bg-amber-600',
    getFilter: () => ({ handlerRole: 'client_finance' }),
  },
  {
    key: 'pending_review',
    label: '待复核',
    icon: CheckCircle,
    color: 'bg-purple-600',
    getFilter: () => ({ status: '待复核' }),
  },
  {
    key: 'rejected',
    label: '已退回',
    icon: XCircle,
    color: 'bg-red-600',
    getFilter: () => ({ status: '已退回' }),
  },
  {
    key: 'stuck',
    label: '卡滞/超期',
    icon: AlertTriangle,
    color: 'bg-orange-600',
    getFilter: () => ({ status: undefined }),
  },
];

export function FilterBar() {
  const { filter, setFilter, loadConsultations, loading, currentUser, consultations } = useAppStore();

  const handleReset = () => {
    setFilter({
      status: undefined,
      handlerRole: undefined,
      currentHandler: undefined,
      clientName: undefined,
      taxType: undefined,
      priority: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const handlerOptions = useMemo(() => {
    const set = new Set<string>();
    consultations.forEach((c) => set.add(c.currentHandler));
    return Array.from(set).sort();
  }, [consultations]);

  const hasActiveFilters = Object.values(filter).some(
    (v) => v !== undefined && v !== ''
  );

  const applyQuickFilter = (qf: QuickFilter) => {
    const patch = qf.getFilter(currentUser);
    // 快捷筛选"卡滞/超期"：后端不支持日期筛选，先清空状态再配合列表视觉高亮
    if (qf.key === 'stuck') {
      setFilter({
        status: undefined,
        handlerRole: undefined,
        currentHandler: undefined,
        clientName: undefined,
        taxType: undefined,
        priority: 3 as any,
        dateFrom: undefined,
        dateTo: undefined,
      });
    } else {
      setFilter({
        status: undefined,
        handlerRole: undefined,
        currentHandler: undefined,
        clientName: undefined,
        taxType: undefined,
        priority: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        ...patch,
      });
    }
    setTimeout(() => loadConsultations(), 0);
  };

  const isQuickFilterActive = (qf: QuickFilter): boolean => {
    const patch = qf.getFilter(currentUser);
    if (qf.key === 'stuck') return filter.priority === 3;
    return Object.entries(patch).every(
      ([k, v]) => (filter as any)[k] === v && v !== undefined
    );
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
          <Filter size={11} />
          快捷筛选
        </span>
        {QUICK_FILTERS.map((qf) => {
          const Icon = qf.icon;
          const active = isQuickFilterActive(qf);
          return (
            <button
              key={qf.key}
              onClick={() => applyQuickFilter(qf)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                active
                  ? `${qf.color} text-white shadow-sm`
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon size={12} />
              {qf.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search size={14} className="inline mr-1" />
              客户名称
            </label>
            <input
              type="text"
              value={filter.clientName || ''}
              onChange={(e) => setFilter({ clientName: e.target.value || undefined })}
              placeholder="搜索客户名称..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={filter.status || ''}
              onChange={(e) =>
                setFilter({ status: (e.target.value as ConsultationStatus) || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">处理角色</label>
            <select
              value={filter.handlerRole || ''}
              onChange={(e) =>
                setFilter({ handlerRole: (e.target.value as UserRole) || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部角色</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={14} className="inline mr-1" />
              处理人
            </label>
            <select
              value={filter.currentHandler || ''}
              onChange={(e) =>
                setFilter({ currentHandler: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部处理人</option>
              {handlerOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">税种</label>
            <select
              value={filter.taxType || ''}
              onChange={(e) => setFilter({ taxType: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部税种</option>
              {TAX_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select
              value={filter.priority || ''}
              onChange={(e) =>
                setFilter({
                  priority: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={filter.dateFrom || ''}
              onChange={(e) => setFilter({ dateFrom: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={filter.dateTo || ''}
              onChange={(e) => setFilter({ dateTo: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => loadConsultations()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              查询
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
              >
                <X size={16} />
                重置
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Filter size={14} className="text-gray-400 mt-1" />
            {filter.clientName && (
              <FilterChip
                label={`客户: ${filter.clientName}`}
                onRemove={() => setFilter({ clientName: undefined })}
              />
            )}
            {filter.status && (
              <FilterChip
                label={`状态: ${filter.status}`}
                onRemove={() => setFilter({ status: undefined })}
              />
            )}
            {filter.handlerRole && (
              <FilterChip
                label={`角色: ${ROLE_OPTIONS.find((r) => r.value === filter.handlerRole)?.label}`}
                onRemove={() => setFilter({ handlerRole: undefined })}
              />
            )}
            {filter.currentHandler && (
              <FilterChip
                label={`处理人: ${filter.currentHandler}`}
                onRemove={() => setFilter({ currentHandler: undefined })}
              />
            )}
            {filter.taxType && (
              <FilterChip
                label={`税种: ${filter.taxType}`}
                onRemove={() => setFilter({ taxType: undefined })}
              />
            )}
            {filter.priority && (
              <FilterChip
                label={`优先级: ${PRIORITY_LABELS[filter.priority]}`}
                onRemove={() => setFilter({ priority: undefined })}
              />
            )}
            {filter.dateFrom && (
              <FilterChip
                label={`从: ${filter.dateFrom}`}
                onRemove={() => setFilter({ dateFrom: undefined })}
              />
            )}
            {filter.dateTo && (
              <FilterChip
                label={`至: ${filter.dateTo}`}
                onRemove={() => setFilter({ dateTo: undefined })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-blue-200 rounded-full p-0.5"
      >
        <X size={12} />
      </button>
    </span>
  );
}
