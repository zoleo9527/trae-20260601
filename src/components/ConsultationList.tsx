import { useAppStore } from '../store/appStore';
import {
  getStatusBadgeClass,
  getPriorityBadgeClass,
  formatDateTime,
  getRoleLabel,
  getNextStatusOptions,
} from '../lib/utils';
import { PRIORITY_LABELS, type UserRole } from '../types';
import type { StatusChangeOption } from './Modals';
import {
  ChevronRight,
  User,
  AlertCircle,
  Building,
  FileText,
  Clock,
  XCircle,
  ListChecks,
  CheckCircle,
  RotateCcw,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { StatusChangeModal } from './Modals';

interface ConsultationListProps {
  onSelect: (id: number) => void;
  selectedId?: number;
}

function getStuckInfo(item: any): { type: string; text: string; color: string } | null {
  if (item.status === '已退回') {
    return {
      type: 'reject',
      text: item.rejectReason || '查看退回原因',
      color: 'bg-red-50 text-red-700 border-red-200',
    };
  }
  if (item.status === '待补录' || item.status === '补录中') {
    return {
      type: 'supplement',
      text: item.supplementReason || '等待客户补录',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (item.deadline) {
    const now = new Date();
    const dl = new Date(item.deadline);
    if (now > dl && item.status !== '资料清单完成') {
      return {
        type: 'overdue',
        text: `超期 ${Math.ceil((now.getTime() - dl.getTime()) / (1000 * 60 * 60 * 24))} 天`,
        color: 'bg-orange-50 text-orange-700 border-orange-200',
      };
    }
  }
  return null;
}

function ActionButton({ opt, onClick }: { opt: any; onClick: () => void }) {
  const isReject = opt.status === '已退回';
  const isSupplement = opt.status === '待补录' || opt.status === '补录中';
  const isReview = opt.status === '待复核' || opt.status === '复核通过';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={opt.label}
      className={`inline-flex items-center gap-0.5 px-1.5 py-1 rounded text-xs font-medium transition-colors ${
        isReject
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : isSupplement
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : isReview
          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
    >
      {isReject ? (
        <RotateCcw size={11} />
      ) : isSupplement ? (
        <ListChecks size={11} />
      ) : isReview ? (
        <CheckCircle size={11} />
      ) : (
        <GripVertical size={11} />
      )}
      {opt.label.length > 6 ? opt.label.slice(0, 6) : opt.label}
    </button>
  );
}

export function ConsultationList({ onSelect, selectedId }: ConsultationListProps) {
  const { consultations, loading, currentUser } = useAppStore();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<StatusChangeOption | null>(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState<number>(0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <FileText size={48} className="mb-4 opacity-30" />
        <p>暂无咨询记录</p>
        <p className="text-sm mt-1">点击右上角"新建咨询"添加</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
              优先
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              咨询编号
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
              客户名称
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              税种
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
              <span className="flex items-center gap-1">
                <User size={12} />
                谁在处理
              </span>
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
              <span className="flex items-center gap-1">
                <AlertTriangle size={12} />
                卡在哪里 / 原因
              </span>
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <GripVertical size={12} />
                快捷操作
              </span>
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                更新时间
              </span>
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {consultations.map((item) => {
            const stuck = getStuckInfo(item);
            const nextOptions = currentUser
              ? getNextStatusOptions(item.status, currentUser.role as UserRole)
              : [];

            const handleQuickAction = (opt: any) => {
              setSelectedConsultationId(item.id);
              setSelectedOption(opt as StatusChangeOption);
              setStatusModalOpen(true);
            };

            return (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`cursor-pointer hover:bg-blue-50/60 transition-colors ${
                  selectedId === item.id ? 'bg-blue-50' : ''
                } ${stuck?.type === 'overdue' ? 'bg-orange-50/30' : ''} ${
                  stuck?.type === 'reject' ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${getPriorityBadgeClass(
                      item.priority
                    )}`}
                    title={PRIORITY_LABELS[item.priority]}
                  >
                    <AlertCircle size={12} />
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-900 tabular-nums">
                  {item.consultationNo}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-900 block truncate max-w-[180px]">
                        {item.clientName}
                      </span>
                      {item.deadline && (
                        <span
                          className={`text-xs ${
                            new Date(item.deadline) < new Date() &&
                            item.status !== '资料清单完成'
                              ? 'text-red-600 font-medium'
                              : 'text-gray-400'
                          }`}
                        >
                          截止 {item.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-sm text-gray-600">{item.taxType}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${
                        item.handlerRole === 'consultant'
                          ? 'bg-blue-500'
                          : item.handlerRole === 'project_manager'
                          ? 'bg-purple-500'
                          : 'bg-emerald-500'
                      }`}
                    >
                      {item.currentHandler.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {item.currentHandler}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {getRoleLabel(item.handlerRole as any)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {stuck ? (
                    <div
                      className={`inline-flex items-start gap-1 px-2 py-1 rounded border text-xs max-w-[240px] ${stuck.color}`}
                    >
                      {stuck.type === 'reject' ? (
                        <XCircle size={12} className="mt-0.5 flex-shrink-0" />
                      ) : stuck.type === 'supplement' ? (
                        <ListChecks size={12} className="mt-0.5 flex-shrink-0" />
                      ) : (
                        <Clock size={12} className="mt-0.5 flex-shrink-0" />
                      )}
                      <span className="truncate" title={stuck.text}>
                        {stuck.text}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle size={12} />
                      流程正常
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    {nextOptions.slice(0, 3).map((opt, idx) => (
                      <ActionButton
                        key={idx}
                        opt={opt}
                        onClick={() => handleQuickAction(opt)}
                      />
                    ))}
                    {nextOptions.length === 0 && (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={11} className="text-gray-400" />
                    {formatDateTime(item.updatedAt).slice(5, 16)}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <ChevronRight size={14} className="text-gray-400" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <StatusChangeModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedOption(null);
        }}
        consultationId={selectedConsultationId}
        option={selectedOption}
      />
    </div>
  );
}
