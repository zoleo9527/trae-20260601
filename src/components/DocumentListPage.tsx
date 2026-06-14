import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import {
  DOCUMENT_STATUS_COLORS,
  TAX_TYPES,
  USER_ROLE_LABELS,
  type DocumentStatus,
  type ConsultationStatus,
  type UserRole,
  type DocumentListItem,
} from '../types';
import {
  FileCheck,
  Search,
  Filter,
  X,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Building,
  ChevronRight,
  FileText,
  ListChecks,
  Inbox,
  CheckSquare,
  Square,
  GripVertical,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { formatDateTime, getRoleLabel, getStatusBadgeClass } from '../lib/utils';
import { UpdateDocumentModal } from './Modals';

interface DocumentListPageProps {
  onSelectConsultation: (id: number) => void;
}

const STATUS_OPTIONS: DocumentStatus[] = [
  '待发起',
  '已要求提供',
  '客户已提供',
  '已收到',
  '已豁免',
];

const CONSULTATION_STATUS_OPTIONS: ConsultationStatus[] = [
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
  getFilter: () => Record<string, any>;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    key: 'all',
    label: '全部资料',
    icon: FileText,
    color: 'bg-slate-600',
    getFilter: () => ({}),
  },
  {
    key: 'pending',
    label: '待提供',
    icon: Clock,
    color: 'bg-blue-600',
    getFilter: () => ({ status: '已要求提供' }),
  },
  {
    key: 'provided',
    label: '客户已提供',
    icon: Inbox,
    color: 'bg-amber-600',
    getFilter: () => ({ status: '客户已提供' }),
  },
  {
    key: 'received',
    label: '已收到',
    icon: CheckCircle,
    color: 'bg-green-600',
    getFilter: () => ({ status: '已收到' }),
  },
  {
    key: 'required',
    label: '必填项',
    icon: AlertCircle,
    color: 'bg-red-600',
    getFilter: () => ({ required: true }),
  },
  {
    key: 'incomplete',
    label: '不完整',
    icon: AlertTriangle,
    color: 'bg-orange-600',
    getFilter: () => ({ incompleteOnly: true }),
  },
  {
    key: 'supplement_phase',
    label: '补录阶段',
    icon: ListChecks,
    color: 'bg-yellow-600',
    getFilter: () => ({ consultationStatus: '补录中' }),
  },
];

export function DocumentListPage({ onSelectConsultation }: DocumentListPageProps) {
  const {
    documentList,
    documentFilter,
    setDocumentFilter,
    loadDocumentList,
    docLoading,
    currentUser,
  } = useAppStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());
  const [batchStatus, setBatchStatus] = useState<string>('');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentListItem | null>(null);

  const handleDocumentEdit = (e: React.MouseEvent, doc: DocumentListItem) => {
    e.stopPropagation();
    setSelectedDoc(doc);
    setDocModalOpen(true);
  };

  useEffect(() => {
    loadDocumentList();
  }, []);

  const handleQuickFilter = (qf: QuickFilter) => {
    const patch = qf.getFilter();
    if (qf.key === 'all') {
      setDocumentFilter({
        status: undefined,
        required: undefined,
        incompleteOnly: undefined,
        clientName: undefined,
        taxType: undefined,
        consultationStatus: undefined,
        handlerRole: undefined,
        currentHandler: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
    } else {
      setDocumentFilter({
        status: undefined,
        required: undefined,
        incompleteOnly: undefined,
        clientName: undefined,
        taxType: undefined,
        consultationStatus: undefined,
        handlerRole: undefined,
        currentHandler: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        ...patch,
      });
    }
    setTimeout(() => loadDocumentList(), 0);
  };

  const isQuickFilterActive = (qf: QuickFilter): boolean => {
    if (qf.key === 'all') {
      return Object.values(documentFilter).every((v) => v === undefined || v === false || v === '');
    }
    const patch = qf.getFilter();
    return Object.entries(patch).every(
      ([k, v]) => (documentFilter as any)[k] === v && v !== undefined
    );
  };

  const handleReset = () => {
    setDocumentFilter({
      status: undefined,
      required: undefined,
      incompleteOnly: undefined,
      clientName: undefined,
      taxType: undefined,
      consultationStatus: undefined,
      handlerRole: undefined,
      currentHandler: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters = Object.values(documentFilter).some(
    (v) => v !== undefined && v !== false && v !== ''
  );

  const handlerOptions = useMemo(() => {
    const set = new Set<string>();
    documentList.forEach((d) => set.add(d.currentHandler));
    return Array.from(set).sort();
  }, [documentList]);

  const stats = useMemo(() => {
    const total = documentList.length;
    const received = documentList.filter((d) => d.status === '已收到').length;
    const waived = documentList.filter((d) => d.status === '已豁免').length;
    const pending = documentList.filter(
      (d) => d.status === '待发起' || d.status === '已要求提供'
    ).length;
    const provided = documentList.filter((d) => d.status === '客户已提供').length;
    const incomplete = documentList.filter((d) => d.incompleteReason).length;
    const required = documentList.filter((d) => d.required).length;
    const requiredDone = documentList.filter(
      (d) => d.required && (d.status === '已收到' || d.status === '已豁免')
    ).length;
    return { total, received, waived, pending, provided, incomplete, required, requiredDone };
  }, [documentList]);

  const toggleDocSelect = (id: number) => {
    const newSet = new Set(selectedDocIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDocIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.size === documentList.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(documentList.map((d) => d.id)));
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedDocIds.size === 0 || !batchStatus || !currentUser) return;
    try {
      await useAppStore.getState().batchUpdateDocuments({
        ids: Array.from(selectedDocIds),
        status: batchStatus as DocumentStatus,
        operator: currentUser.name,
        operatorRole: currentUser.role as UserRole,
      });
      setSelectedDocIds(new Set());
      setBatchStatus('');
    } catch (e) {
      alert('批量操作失败: ' + String(e));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="border-b border-gray-200 bg-white">
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
                onClick={() => handleQuickFilter(qf)}
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

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                showAdvanced
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <GripVertical size={12} />
              高级筛选
            </button>
            <button
              onClick={() => loadDocumentList()}
              disabled={docLoading}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 flex items-center gap-1"
            >
              <RefreshCw size={12} className={docLoading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="p-3 border-b border-gray-100 bg-slate-50/50">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <Search size={12} className="inline mr-1" />
                  客户名称
                </label>
                <input
                  type="text"
                  value={documentFilter.clientName || ''}
                  onChange={(e) =>
                    setDocumentFilter({ clientName: e.target.value || undefined })
                  }
                  placeholder="搜索客户..."
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1">资料状态</label>
                <select
                  value={documentFilter.status || ''}
                  onChange={(e) =>
                    setDocumentFilter({
                      status: (e.target.value as DocumentStatus) || undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1">咨询状态</label>
                <select
                  value={documentFilter.consultationStatus || ''}
                  onChange={(e) =>
                    setDocumentFilter({
                      consultationStatus: (e.target.value as ConsultationStatus) || undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {CONSULTATION_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-28">
                <label className="block text-xs font-medium text-gray-600 mb-1">处理角色</label>
                <select
                  value={documentFilter.handlerRole || ''}
                  onChange={(e) =>
                    setDocumentFilter({
                      handlerRole: (e.target.value as UserRole) || undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-28">
                <label className="block text-xs font-medium text-gray-600 mb-1">税种</label>
                <select
                  value={documentFilter.taxType || ''}
                  onChange={(e) =>
                    setDocumentFilter({ taxType: e.target.value || undefined })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {TAX_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1">处理人</label>
                <select
                  value={documentFilter.currentHandler || ''}
                  onChange={(e) =>
                    setDocumentFilter({ currentHandler: e.target.value || undefined })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {handlerOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-28">
                <label className="block text-xs font-medium text-gray-600 mb-1">开始日期</label>
                <input
                  type="date"
                  value={documentFilter.dateFrom || ''}
                  onChange={(e) => setDocumentFilter({ dateFrom: e.target.value || undefined })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-28">
                <label className="block text-xs font-medium text-gray-600 mb-1">结束日期</label>
                <input
                  type="date"
                  value={documentFilter.dateTo || ''}
                  onChange={(e) => setDocumentFilter({ dateTo: e.target.value || undefined })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={documentFilter.required === true}
                    onChange={(e) =>
                      setDocumentFilter({ required: e.target.checked ? true : undefined })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  仅必填
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={documentFilter.incompleteOnly === true}
                    onChange={(e) =>
                      setDocumentFilter({
                        incompleteOnly: e.target.checked ? true : undefined,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  仅不完整
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => loadDocumentList()}
                  disabled={docLoading}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 text-sm"
                >
                  <Search size={14} />
                  查询
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1 text-sm"
                  >
                    <X size={14} />
                    重置
                  </button>
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                <Filter size={12} className="text-gray-400" />
                {documentFilter.status && (
                  <FilterChip
                    label={`资料状态: ${documentFilter.status}`}
                    onRemove={() => setDocumentFilter({ status: undefined })}
                  />
                )}
                {documentFilter.consultationStatus && (
                  <FilterChip
                    label={`咨询状态: ${documentFilter.consultationStatus}`}
                    onRemove={() => setDocumentFilter({ consultationStatus: undefined })}
                  />
                )}
                {documentFilter.handlerRole && (
                  <FilterChip
                    label={`角色: ${USER_ROLE_LABELS[documentFilter.handlerRole]}`}
                    onRemove={() => setDocumentFilter({ handlerRole: undefined })}
                  />
                )}
                {documentFilter.currentHandler && (
                  <FilterChip
                    label={`处理人: ${documentFilter.currentHandler}`}
                    onRemove={() => setDocumentFilter({ currentHandler: undefined })}
                  />
                )}
                {documentFilter.clientName && (
                  <FilterChip
                    label={`客户: ${documentFilter.clientName}`}
                    onRemove={() => setDocumentFilter({ clientName: undefined })}
                  />
                )}
                {documentFilter.taxType && (
                  <FilterChip
                    label={`税种: ${documentFilter.taxType}`}
                    onRemove={() => setDocumentFilter({ taxType: undefined })}
                  />
                )}
                {documentFilter.required && (
                  <FilterChip
                    label="仅必填"
                    onRemove={() => setDocumentFilter({ required: undefined })}
                  />
                )}
                {documentFilter.incompleteOnly && (
                  <FilterChip
                    label="仅不完整"
                    onRemove={() => setDocumentFilter({ incompleteOnly: undefined })}
                  />
                )}
                {documentFilter.dateFrom && (
                  <FilterChip
                    label={`从: ${documentFilter.dateFrom}`}
                    onRemove={() => setDocumentFilter({ dateFrom: undefined })}
                  />
                )}
                {documentFilter.dateTo && (
                  <FilterChip
                    label={`至: ${documentFilter.dateTo}`}
                    onRemove={() => setDocumentFilter({ dateTo: undefined })}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-6 gap-px bg-gray-200 border-b border-gray-200">
        <StatCard label="资料总数" value={stats.total} color="text-gray-700" icon={<FileText size={14} />} />
        <StatCard label="待提供" value={stats.pending} color="text-blue-600" icon={<Clock size={14} />} />
        <StatCard label="客户已提供" value={stats.provided} color="text-amber-600" icon={<Inbox size={14} />} />
        <StatCard label="已收到" value={stats.received} color="text-green-600" icon={<CheckCircle size={14} />} />
        <StatCard label="不完整" value={stats.incomplete} color="text-orange-600" icon={<AlertTriangle size={14} />} />
        <StatCard
          label="必填完成"
          value={`${stats.requiredDone}/${stats.required}`}
          color="text-purple-600"
          icon={<AlertCircle size={14} />}
        />
      </div>

      {selectedDocIds.size > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-3">
          <span className="text-sm text-blue-700 font-medium">
            已选择 {selectedDocIds.size} 份资料
          </span>
          <select
            value={batchStatus}
            onChange={(e) => setBatchStatus(e.target.value)}
            className="text-sm px-2 py-1 border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">批量状态变更</option>
            <option value="已要求提供">→ 已要求提供</option>
            <option value="客户已提供">→ 客户已提供</option>
            <option value="已收到">→ 已收到</option>
            <option value="已豁免">→ 已豁免</option>
          </select>
          <button
            onClick={handleBatchUpdate}
            disabled={!batchStatus}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            执行
          </button>
          <button
            onClick={() => {
              setSelectedDocIds(new Set());
              setBatchStatus('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            取消选择
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {docLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : documentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileCheck size={48} className="mb-4 opacity-30" />
            <p>暂无资料记录</p>
            <p className="text-sm mt-1">调整筛选条件或添加资料</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2.5 py-2 text-left w-7">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {selectedDocIds.size === documentList.length && documentList.length > 0 ? (
                      <CheckSquare size={14} className="text-blue-600" />
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                  资料名称
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14">
                  必填
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  资料状态
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  所属客户 / 咨询
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  咨询状态
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    谁在处理
                  </span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  提供/接收
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  时间
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {documentList.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => onSelectConsultation(doc.consultationId)}
                  className={`cursor-pointer hover:bg-blue-50/60 transition-colors ${
                    selectedDocIds.has(doc.id) ? 'bg-blue-50' : ''
                  } ${doc.incompleteReason ? 'bg-amber-50/30' : ''}`}
                >
                  <td className="px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleDocSelect(doc.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectedDocIds.has(doc.id) ? (
                        <CheckSquare size={14} className="text-blue-600" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{doc.itemName}</span>
                      {doc.incompleteReason && (
                        <span
                          className="inline-flex items-center gap-0.5 text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded"
                          title={doc.incompleteReason}
                        >
                          <AlertTriangle size={9} />
                          不完整
                        </span>
                      )}
                    </div>
                    {(doc.itemDescription || doc.remarks || doc.incompleteReason) && (
                      <div className="mt-0.5 space-y-0.5">
                        {doc.incompleteReason && (
                          <p className="text-xs text-amber-700">原因: {doc.incompleteReason}</p>
                        )}
                        {doc.remarks && (
                          <p className="text-xs text-gray-500">备注: {doc.remarks}</p>
                        )}
                        {doc.itemDescription && !doc.remarks && !doc.incompleteReason && (
                          <p className="text-xs text-gray-400">{doc.itemDescription}</p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {doc.required ? (
                      <span className="text-red-500 font-medium text-xs">是</span>
                    ) : (
                      <span className="text-gray-400 text-xs">否</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        DOCUMENT_STATUS_COLORS[doc.status as DocumentStatus]
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Building size={12} className="text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                          {doc.clientName}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {doc.consultationNo} · {doc.taxType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(
                        doc.consultationStatus
                      )}`}
                    >
                      {doc.consultationStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${
                          doc.handlerRole === 'consultant'
                            ? 'bg-blue-500'
                            : doc.handlerRole === 'project_manager'
                            ? 'bg-purple-500'
                            : 'bg-emerald-500'
                        }`}
                      >
                        {doc.currentHandler.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {doc.currentHandler}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {getRoleLabel(doc.handlerRole)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-0.5 text-xs text-gray-600">
                      {doc.providedBy && (
                        <div>提: <span className="text-gray-800">{doc.providedBy}</span></div>
                      )}
                      {doc.receivedBy && (
                        <div>收: <span className="text-gray-800">{doc.receivedBy}</span></div>
                      )}
                      {!doc.providedBy && !doc.receivedBy && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-0.5 text-xs text-gray-500">
                      {doc.providedAt && (
                        <div className="flex items-center gap-1">
                          <Clock size={9} />
                          提: {formatDateTime(doc.providedAt).slice(5, 16)}
                        </div>
                      )}
                      {doc.receivedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle size={9} className="text-green-500" />
                          收: {formatDateTime(doc.receivedAt).slice(5, 16)}
                        </div>
                      )}
                      {!doc.providedAt && !doc.receivedAt && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock size={9} />
                          {formatDateTime(doc.createdAt).slice(5, 16)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => handleDocumentEdit(e, doc)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
                        title="更新资料状态"
                      >
                        <Pencil size={13} />
                      </button>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <UpdateDocumentModal
        isOpen={docModalOpen}
        onClose={() => {
          setDocModalOpen(false);
          setSelectedDoc(null);
        }}
        documentId={selectedDoc?.id || 0}
        documentName={selectedDoc?.itemName || ''}
        currentStatus={selectedDoc?.status || ''}
        document={selectedDoc || undefined}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <div className={`text-lg font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
      {label}
      <button onClick={onRemove} className="hover:bg-blue-200 rounded-full p-0.5">
        <X size={10} />
      </button>
    </span>
  );
}
