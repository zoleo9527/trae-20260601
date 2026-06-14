import { useAppStore } from '../store/appStore';
import {
  getStatusBadgeClass,
  getPriorityBadgeClass,
  formatDateTime,
  getNextStatusOptions,
  getRoleLabel,
} from '../lib/utils';
import {
  PRIORITY_LABELS,
  DOCUMENT_STATUS_COLORS,
  USER_ROLE_LABELS,
  WORKFLOW_STEPS,
  type DocumentStatus,
  type ConsultationStatus,
  type UserRole,
} from '../types';
import type { StatusChangeOption } from './Modals';
import {
  ArrowLeft,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  Plus,
  MessageSquare,
  FileCheck,
  History,
  ChevronDown,
  ChevronUp,
  Edit,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  RotateCcw,
  ListChecks,
  Users,
  GripVertical,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { StatusChangeModal, UpdateDocumentModal } from './Modals';

interface ConsultationDetailProps {
  onBack: () => void;
  onStatusChange: () => void;
  onAddDocument: () => void;
}

export function ConsultationDetail({
  onBack,
  onAddDocument,
}: ConsultationDetailProps) {
  const { currentDetail, currentUser, loading } = useAppStore();
  const [showLogs, setShowLogs] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatusOption, setSelectedStatusOption] = useState<StatusChangeOption | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{ id: number; name: string; status: string } | null>(null);
  const [docFilter, setDocFilter] = useState<string>('all');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());
  const [batchStatus, setBatchStatus] = useState<string>('');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!currentDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FileText size={48} className="mb-4 opacity-30" />
        <p>请选择一条咨询记录查看详情</p>
      </div>
    );
  }

  const { consultation, documents, logs, consultantName, projectManagerName, clientFinanceName } =
    currentDetail;

  const nextOptions = currentUser
    ? getNextStatusOptions(consultation.status, currentUser.role as UserRole)
    : [];

  const docStats = {
    total: documents.length,
    received: documents.filter((d) => d.status === '已收到').length,
    waived: documents.filter((d) => d.status === '已豁免').length,
    provided: documents.filter((d) => d.status === '客户已提供').length,
    requested: documents.filter((d) => d.status === '已要求提供').length,
    pending: documents.filter((d) => d.status === '待发起').length,
  };

  const docDone = docStats.received + docStats.waived;
  const progress = docStats.total > 0 ? Math.round((docDone / docStats.total) * 100) : 0;

  const filteredDocuments = useMemo(() => {
    if (docFilter === 'all') return documents;
    if (docFilter === 'pending') return documents.filter((d) => d.status !== '已收到' && d.status !== '已豁免');
    if (docFilter === 'done') return documents.filter((d) => d.status === '已收到' || d.status === '已豁免');
    if (docFilter === 'required') return documents.filter((d) => d.required);
    if (docFilter === 'incomplete') return documents.filter((d) => d.incompleteReason);
    return documents.filter((d) => d.status === docFilter);
  }, [documents, docFilter]);

  const currentStepIdx = WORKFLOW_STEPS.findIndex((s) => s.status === consultation.status);

  const handleStatusClick = (opt: { status: ConsultationStatus; handlerRole: UserRole; label: string }) => {
    setSelectedStatusOption(opt as StatusChangeOption);
    setStatusModalOpen(true);
  };

  const handleDocumentClick = (doc: { id: number; itemName: string; status: string }) => {
    setSelectedDoc({ id: doc.id, name: doc.itemName, status: doc.status });
    setDocModalOpen(true);
  };

  const toggleDocSelect = (id: number) => {
    const newSet = new Set(selectedDocIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDocIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments.map((d) => d.id)));
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

  const getStuckReason = () => {
    if (consultation.status === '已退回') {
      return { type: 'reject', text: consultation.rejectReason || '请查看退回原因' };
    }
    if (consultation.status === '待补录' || consultation.status === '补录中') {
      return { type: 'supplement', text: consultation.supplementReason || '请查看补录要求' };
    }
    if (consultation.deadline) {
      const now = new Date();
      const dl = new Date(consultation.deadline);
      if (now > dl && consultation.status !== '资料清单完成') {
        return { type: 'overdue', text: `已超过截止日期 ${consultation.deadline}` };
      }
    }
    return null;
  };

  const stuckReason = getStuckReason();

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-slate-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {consultation.clientName}
              </h2>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                  consultation.status
                )}`}
              >
                {consultation.status}
              </span>
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${getPriorityBadgeClass(
                  consultation.priority
                )}`}
                title={`优先级：${PRIORITY_LABELS[consultation.priority]}`}
              >
                <AlertCircle size={11} />
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="font-mono">{consultation.consultationNo}</span>
              <span>·</span>
              <span>{consultation.taxType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nextOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              {nextOptions.map((opt, idx) => {
                const needsReason =
                  opt.status === '已退回' ||
                  opt.status === '待补录' ||
                  opt.status === '补录中' ||
                  opt.status === '待复核';
                const isReject = opt.status === '已退回';
                const isSupplement = opt.status === '待补录' || opt.status === '补录中';
                const isReview = opt.status === '待复核' || opt.status === '复核通过';
                return (
                  <button
                    key={idx}
                    onClick={() => handleStatusClick(opt)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      isReject
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : isSupplement
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : isReview
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isReject ? (
                      <RotateCcw size={14} />
                    ) : isSupplement ? (
                      <ListChecks size={14} />
                    ) : isReview ? (
                      <CheckCircle size={14} />
                    ) : (
                      <GripVertical size={14} />
                    )}
                    {opt.label.length > 8 ? opt.label.slice(0, 8) : opt.label}
                    {needsReason && <span className="opacity-80">*</span>}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={onAddDocument}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            添加资料
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-gradient-to-b from-slate-50 to-white border-b border-gray-200">
          <div className="grid grid-cols-3 gap-px bg-gray-200 border-t border-gray-200">
            <div className="bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <Users size={12} />
                谁在处理？
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    consultation.handlerRole === 'consultant'
                      ? 'bg-blue-500'
                      : consultation.handlerRole === 'project_manager'
                      ? 'bg-purple-500'
                      : 'bg-emerald-500'
                  }`}
                >
                  {consultation.currentHandler.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {consultation.currentHandler}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getRoleLabel(consultation.handlerRole as UserRole)}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-gray-400 mb-0.5">税务顾问</div>
                  <div className="text-gray-700 font-medium truncate">
                    {consultantName || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-0.5">项目经理</div>
                  <div className="text-gray-700 font-medium truncate">
                    {projectManagerName || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-0.5">客户财务</div>
                  <div className="text-gray-700 font-medium truncate">
                    {clientFinanceName || '-'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <AlertTriangle size={12} />
                卡在哪里？
              </div>
              {stuckReason ? (
                <div
                  className={`p-3 rounded-lg ${
                    stuckReason.type === 'reject'
                      ? 'bg-red-50 border border-red-200'
                      : stuckReason.type === 'supplement'
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-orange-50 border border-orange-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {stuckReason.type === 'reject' ? (
                      <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    ) : stuckReason.type === 'supplement' ? (
                      <ListChecks size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-semibold mb-0.5 ${
                          stuckReason.type === 'reject'
                            ? 'text-red-800'
                            : stuckReason.type === 'supplement'
                            ? 'text-amber-800'
                            : 'text-orange-800'
                        }`}
                      >
                        {stuckReason.type === 'reject'
                          ? '已被退回'
                          : stuckReason.type === 'supplement'
                          ? consultation.status === '补录中'
                            ? '客户补录中'
                            : '等待补录'
                          : '已超期'}
                      </div>
                      <div
                        className={`text-xs leading-relaxed ${
                          stuckReason.type === 'reject'
                            ? 'text-red-700'
                            : stuckReason.type === 'supplement'
                            ? 'text-amber-700'
                            : 'text-orange-700'
                        }`}
                      >
                        {stuckReason.text}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-green-800">流程正常</div>
                    <div className="text-xs text-green-600">当前无卡滞</div>
                  </div>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">截止日期</span>
                <span className={`font-medium ${
                  consultation.deadline && new Date(consultation.deadline) < new Date() && consultation.status !== '资料清单完成'
                    ? 'text-red-600'
                    : 'text-gray-700'
                }`}>
                  {consultation.deadline || '未设置'}
                </span>
              </div>
            </div>

            <div className="bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <FileCheck size={12} />
                资料为什么没完成？
              </div>
              {documents.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-semibold text-gray-700">尚未建立资料清单</div>
                      <div className="text-xs text-gray-500">点击右上角"添加资料"开始</div>
                    </div>
                  </div>
                </div>
              ) : progress >= 100 ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-green-800">资料清单已完成</div>
                    <div className="text-xs text-green-600">全部资料已收齐/豁免</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-600">资料进度</span>
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {docDone}/{docStats.total} ({progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-blue-700">
                      <ClockIcon size={10} />
                      待提供 {docStats.requested + docStats.pending}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded text-amber-700">
                      <Users size={10} />
                      已提供 {docStats.provided}
                    </div>
                  </div>
                  {documents.filter((d) => d.incompleteReason).length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-100 text-xs text-red-700">
                      <div className="flex items-center gap-1 font-medium mb-0.5">
                        <AlertTriangle size={11} />
                        {documents.filter((d) => d.incompleteReason).length} 份资料不完整
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">资料总数</span>
                <span className="font-medium text-gray-700 tabular-nums">
                  {documents.length} 项
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
            <GripVertical size={12} />
            主流程进度 · 退回/补录/复核已纳入流程
          </div>
          <div className="flex items-stretch gap-0.5">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isCurrent = step.status === consultation.status;
              const isPast = currentStepIdx !== -1 && idx < currentStepIdx;
              const isReject = step.status === '已退回';
              const isSupplement = step.status === '待补录' || step.status === '补录中';
              const isReview = step.status === '待复核' || step.status === '复核通过';
              return (
                <div key={step.status} className="flex-1 flex flex-col items-stretch">
                  <div
                    className={`px-2 py-1.5 text-center text-xs font-medium rounded-t ${
                      isCurrent
                        ? isReject
                          ? 'bg-red-600 text-white'
                          : isSupplement
                          ? 'bg-amber-600 text-white'
                          : isReview
                          ? 'bg-purple-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isPast
                        ? isReject
                          ? 'bg-red-100 text-red-700'
                          : isSupplement
                          ? 'bg-amber-100 text-amber-700'
                          : isReview
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`h-1 ${
                      isCurrent
                        ? isReject
                          ? 'bg-red-600'
                          : isSupplement
                          ? 'bg-amber-600'
                          : isReview
                          ? 'bg-purple-600'
                          : 'bg-blue-600'
                        : isPast
                        ? isReject
                          ? 'bg-red-300'
                          : isSupplement
                          ? 'bg-amber-300'
                          : isReview
                          ? 'bg-purple-300'
                          : 'bg-green-400'
                        : 'bg-gray-200'
                    } ${idx === WORKFLOW_STEPS.length - 1 ? 'rounded-br' : ''} ${idx === 0 ? 'rounded-bl' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <FileText size={14} />
              咨询描述
            </div>
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm">
              {consultation.description}
            </p>
            {consultation.remarks && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1">
                  <MessageSquare size={11} />
                  备注
                </div>
                <p className="text-sm text-gray-700">{consultation.remarks}</p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                  <FileCheck size={16} />
                  资料清单
                </h3>
                <span className="text-xs text-gray-500">
                  共 {documents.length} 项 · 已完成 {docDone} 项
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" />
                  <span className="text-gray-600">{docStats.received} 已收到</span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon size={12} className="text-amber-500" />
                  <span className="text-gray-600">{docStats.provided + docStats.requested} 待处理</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle size={12} className="text-gray-400" />
                  <span className="text-gray-600">{docStats.waived} 已豁免</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Filter size={11} />
                  筛选：
                </span>
                {[
                  { key: 'all', label: '全部' },
                  { key: 'pending', label: '待收' },
                  { key: 'done', label: '已完成' },
                  { key: 'required', label: '必填' },
                  { key: 'incomplete', label: '不完整' },
                  { key: '已要求提供', label: '待提供' },
                  { key: '客户已提供', label: '已提供' },
                  { key: '已收到', label: '已收到' },
                  { key: '已豁免', label: '已豁免' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setDocFilter(f.key)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      docFilter === f.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {selectedDocIds.size > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  <span className="text-xs text-blue-700 font-medium">
                    已选 {selectedDocIds.size} 项
                  </span>
                  <select
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(e.target.value)}
                    className="text-xs px-2 py-1 border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">批量操作</option>
                    <option value="已要求提供">→ 已要求提供</option>
                    <option value="客户已提供">→ 客户已提供</option>
                    <option value="已收到">→ 已收到</option>
                    <option value="已豁免">→ 已豁免</option>
                  </select>
                  <button
                    onClick={handleBatchUpdate}
                    disabled={!batchStatus}
                    className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    执行
                  </button>
                  <button
                    onClick={() => setSelectedDocIds(new Set())}
                    className="text-xs p-1 text-gray-500 hover:text-gray-700 hover:bg-blue-100 rounded"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-gray-600">暂无资料清单</p>
                <p className="text-xs mt-1 text-gray-400">点击右上角"添加资料"创建</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                <Filter size={20} className="mx-auto mb-1 opacity-30" />
                <p className="text-sm">当前筛选条件下无匹配资料</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2.5 py-2 text-left w-7">
                        <button
                          onClick={toggleSelectAll}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0 ? (
                            <CheckSquare size={14} className="text-blue-600" />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                      </th>
                      <th className="px-2.5 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        资料名称
                      </th>
                      <th className="px-2.5 py-2 text-left text-xs font-medium text-gray-500 uppercase w-14">
                        必填
                      </th>
                      <th className="px-2.5 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                        状态
                      </th>
                      <th className="px-2.5 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">
                        提供/接收
                      </th>
                      <th className="px-2.5 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                        时间
                      </th>
                      <th className="px-2.5 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className={`hover:bg-blue-50/50 transition-colors ${
                          selectedDocIds.has(doc.id) ? 'bg-blue-50' : ''
                        } ${doc.incompleteReason ? 'bg-amber-50/40' : ''}`}
                      >
                        <td className="px-2.5 py-2">
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
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">
                              {doc.itemName}
                            </span>
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
                          {(doc.incompleteReason || doc.remarks || doc.itemDescription) && (
                            <div className="mt-0.5 space-y-0.5">
                              {doc.incompleteReason && (
                                <p className="text-xs text-amber-700">
                                  原因: {doc.incompleteReason}
                                </p>
                              )}
                              {doc.remarks && (
                                <p className="text-xs text-gray-500">
                                  备注: {doc.remarks}
                                </p>
                              )}
                              {doc.itemDescription && !doc.remarks && !doc.incompleteReason && (
                                <p className="text-xs text-gray-400">
                                  {doc.itemDescription}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2.5 py-2">
                          {doc.required ? (
                            <span className="text-red-500 font-medium text-xs">是</span>
                          ) : (
                            <span className="text-gray-400 text-xs">否</span>
                          )}
                        </td>
                        <td className="px-2.5 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              DOCUMENT_STATUS_COLORS[doc.status as DocumentStatus]
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-2.5 py-2">
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
                        <td className="px-2.5 py-2">
                          <div className="space-y-0.5 text-xs text-gray-500">
                            {doc.providedAt && (
                              <div className="flex items-center gap-1">
                                <Clock size={9} />
                                提: {formatDateTime(doc.providedAt as any).slice(5, 16)}
                              </div>
                            )}
                            {doc.receivedAt && (
                              <div className="flex items-center gap-1">
                                <CheckCircle size={9} className="text-green-500" />
                                收: {formatDateTime(doc.receivedAt as any).slice(5, 16)}
                              </div>
                            )}
                            {!doc.providedAt && !doc.receivedAt && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <button
                            onClick={() => handleDocumentClick(doc as any)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
                            title="更新状态"
                          >
                            <Edit size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center justify-between w-full py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 px-2 rounded"
            >
              <span className="flex items-center gap-1.5">
                <History size={15} />
                操作日志 ({logs.length})
                <span className="text-xs text-gray-400 font-normal">
                  · 状态变化、责任人、时间点、原因均记录在此
                </span>
              </span>
              {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showLogs && (
              <div className="space-y-1.5 mt-1.5 border border-gray-100 rounded-lg p-2.5 bg-gray-50/50 max-h-80 overflow-auto">
                {logs.length === 0 ? (
                  <div className="py-5 text-center text-gray-400 text-xs">
                    暂无操作日志
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-2.5 p-2.5 bg-white rounded-lg border border-gray-100"
                    >
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          log.operatorRole === 'consultant'
                            ? 'bg-blue-500'
                            : log.operatorRole === 'project_manager'
                            ? 'bg-purple-500'
                            : 'bg-emerald-500'
                        }`}
                      >
                        {log.operator.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm">
                            {log.operator}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {USER_ROLE_LABELS[log.operatorRole as keyof typeof USER_ROLE_LABELS]}
                          </span>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {log.operationType}
                          </span>
                        </div>
                        {(log.fromStatus || log.toStatus) && (
                          <div className="text-xs text-gray-600 mt-1 flex items-center gap-1.5 flex-wrap">
                            {log.fromStatus && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                {log.fromStatus}
                              </span>
                            )}
                            {log.fromStatus && log.toStatus && (
                              <span className="text-gray-400">→</span>
                            )}
                            {log.toStatus && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                                {log.toStatus}
                              </span>
                            )}
                          </div>
                        )}
                        {log.reason && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              <AlertTriangle size={9} />
                              {log.reason}
                            </span>
                          </div>
                        )}
                        {log.remarks && (
                          <div className="mt-1 text-xs text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
                            {log.remarks}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={9} />
                          {formatDateTime(log.createdAt as any)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <StatusChangeModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedStatusOption(null);
        }}
        consultationId={consultation.id}
        option={selectedStatusOption}
      />

      <UpdateDocumentModal
        isOpen={docModalOpen}
        onClose={() => {
          setDocModalOpen(false);
          setSelectedDoc(null);
        }}
        documentId={selectedDoc?.id || 0}
        documentName={selectedDoc?.name || ''}
        currentStatus={selectedDoc?.status || ''}
      />
    </div>
  );
}
