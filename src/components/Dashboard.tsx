import { useAppStore } from '../store/appStore';
import { getStatusBadgeClass, formatDateTime, getRoleLabel } from '../lib/utils';
import type { Consultation, ConsultationDetail } from '../types';
import { useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Clock,
  FileCheck,
  ArrowRight,
  CheckCircle,
  XCircle,
  BarChart3,
  User,
  ChevronRight,
  ListChecks,
  RotateCcw,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface DashboardProps {
  onSelectConsultation: (id: number) => void;
}

const STATUS_CARDS: {
  key: keyof Pick<
    import('../types').DashboardStats,
    | 'pendingAccept'
    | 'accepted'
    | 'pendingSupplement'
    | 'supplementing'
    | 'pendingReview'
    | 'reviewed'
    | 'rejected'
    | 'docListCompleted'
  >;
  label: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  icon: any;
}[] = [
  { key: 'pendingAccept', label: '待受理', borderColor: 'border-l-gray-400', iconBg: 'bg-gray-100', iconColor: 'text-gray-500', icon: Clock },
  { key: 'accepted', label: '已受理', borderColor: 'border-l-blue-400', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', icon: User },
  { key: 'pendingSupplement', label: '待补录', borderColor: 'border-l-yellow-400', iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600', icon: ListChecks },
  { key: 'supplementing', label: '补录中', borderColor: 'border-l-orange-400', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', icon: TrendingUp },
  { key: 'pendingReview', label: '待复核', borderColor: 'border-l-purple-400', iconBg: 'bg-purple-50', iconColor: 'text-purple-500', icon: AlertCircle },
  { key: 'reviewed', label: '复核通过', borderColor: 'border-l-green-400', iconBg: 'bg-green-50', iconColor: 'text-green-500', icon: CheckCircle },
  { key: 'rejected', label: '已退回', borderColor: 'border-l-red-400', iconBg: 'bg-red-50', iconColor: 'text-red-500', icon: RotateCcw },
  { key: 'docListCompleted', label: '资料清单完成', borderColor: 'border-l-emerald-400', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', icon: FileCheck },
];

function ConsultationRow({
  item,
  reason,
  reasonLabel,
  onSelect,
}: {
  item: Consultation;
  reason?: string;
  reasonLabel?: string;
  onSelect: (id: number) => void;
}) {
  return (
    <div
      onClick={() => onSelect(item.id)}
      className="flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 truncate">
            {item.clientName}
          </span>
          <span className="font-mono text-xs text-gray-400">
            {item.consultationNo}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
              item.status
            )}`}
          >
            {item.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <User size={12} />
            {item.currentHandler}
            <span className="text-gray-400">({getRoleLabel(item.handlerRole)})</span>
          </span>
          {item.deadline && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              截止 {formatDateTime(item.deadline)}
            </span>
          )}
        </div>
        {reason && (
          <div className="flex items-start gap-1 mt-1.5 text-xs">
            <span className="text-gray-400 shrink-0">{reasonLabel || '原因'}:</span>
            <span className="text-red-600">{reason}</span>
          </div>
        )}
      </div>
      <ArrowRight
        size={14}
        className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors"
      />
    </div>
  );
}

function DocProgressRow({
  detail,
  onSelect,
}: {
  detail: ConsultationDetail;
  onSelect: (id: number) => void;
}) {
  const { consultation, documents } = detail;
  const total = documents.length;
  const received = documents.filter(
    (d) => d.status === '已收到' || d.status === '已豁免'
  ).length;
  const pct = total > 0 ? Math.round((received / total) * 100) : 0;
  const incompleteDocs = documents.filter(
    (d) => d.status !== '已收到' && d.status !== '已豁免' && d.incompleteReason
  );

  return (
    <div
      onClick={() => onSelect(consultation.id)}
      className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-gray-900 truncate">
          {consultation.clientName}
        </span>
        <span className="font-mono text-xs text-gray-400">
          {consultation.consultationNo}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
            consultation.status
          )}`}
        >
          {consultation.status}
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
          <User size={12} />
          {consultation.currentHandler}
          <span className="text-gray-400">({getRoleLabel(consultation.handlerRole)})</span>
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 tabular-nums shrink-0">
          {received}/{total} ({pct}%)
        </span>
      </div>

      {incompleteDocs.length > 0 && (
        <div className="space-y-1">
          {incompleteDocs.slice(0, 2).map((doc) => (
            <div key={doc.id} className="flex items-start gap-1.5 text-xs">
              <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
              <span className="text-gray-600">{doc.itemName}:</span>
              <span className="text-red-600 truncate">{doc.incompleteReason}</span>
            </div>
          ))}
          {incompleteDocs.length > 2 && (
            <div className="text-xs text-gray-400 pl-4">
              还有 {incompleteDocs.length - 2} 份资料不完整...
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mt-1">
        <ChevronRight
          size={14}
          className="text-gray-300 group-hover:text-gray-500 transition-colors"
        />
      </div>
    </div>
  );
}

export function Dashboard({ onSelectConsultation }: DashboardProps) {
  const { dashboardStats, currentUser, loadDashboardStats } = useAppStore();

  useEffect(() => {
    if (currentUser) loadDashboardStats();
  }, [currentUser]);

  if (!dashboardStats) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        加载仪表盘数据...
      </div>
    );
  }

  const {
    myPending,
    totalDocuments,
    docsReceived,
    docsPending,
    overdueConsultations,
    rejectedConsultations,
    incompleteDocConsultations,
    totalConsultations,
  } = dashboardStats;

  const stuckItems = [...overdueConsultations, ...rejectedConsultations];
  const docPct = totalDocuments > 0 ? Math.round((docsReceived / totalDocuments) * 100) : 0;

  const pendingByRole = overdueConsultations
    .concat(rejectedConsultations)
    .concat(incompleteDocConsultations.map((d) => d.consultation))
    .filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i
    )
    .reduce(
      (acc, c) => {
        const role = c.handlerRole;
        if (!acc[role]) acc[role] = [];
        acc[role].push(c);
        return acc;
      },
      {} as Record<string, Consultation[]>
    );

  const roleOrder = ['consultant', 'project_manager', 'client_finance'];

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="grid grid-cols-8 gap-3">
        {STATUS_CARDS.map(({ key, label, borderColor, iconBg, iconColor, icon: Icon }) => (
          <div
            key={key}
            className={`bg-white rounded-lg border border-l-4 ${borderColor} border-gray-100 px-3 py-2.5 flex items-center gap-3 hover:shadow-sm transition-shadow`}
          >
            <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon size={18} className={iconColor} />
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900 tabular-nums leading-none">
                {dashboardStats[key]}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 px-4 py-3 col-span-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-500" />
              资料清单总体进度
            </span>
            <span className="text-xs text-gray-500 tabular-nums">
              已收 <span className="font-semibold text-green-600">{docsReceived}</span> / 共 {totalDocuments}
              {docsPending > 0 && (
                <span className="text-amber-600 ml-2">待收 {docsPending}</span>
              )}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${docPct}%`,
                backgroundColor: docPct >= 80 ? '#10b981' : docPct >= 50 ? '#3b82f6' : '#f59e0b',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">{docPct}% 完成</span>
            <span className="text-xs text-gray-400">
              {docsPending > 0 ? `${docsPending} 份待收` : '全部收齐'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white px-4 py-3 flex flex-col justify-center">
          <div className="text-xs opacity-80 mb-1">当前用户待办</div>
          <div className="text-3xl font-bold tabular-nums">{myPending}</div>
          <div className="text-xs opacity-70 mt-1">
            {currentUser?.name} · {getRoleLabel(currentUser?.role as any)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users size={16} className="text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">谁在处理？</div>
              <div className="text-xs text-gray-500">按角色分组的待处理事项</div>
            </div>
            <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {Object.values(pendingByRole).reduce((a, b) => a + b.length, 0)} 件
            </span>
          </div>
          <div className="p-2 max-h-80 overflow-auto">
            {Object.keys(pendingByRole).length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-300" />
                <p>当前无待处理项</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roleOrder.filter(role => pendingByRole[role]).map((role) => {
                  const items = pendingByRole[role];
                  return (
                    <div key={role} className="border border-gray-100 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/70">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${
                            role === 'consultant'
                              ? 'bg-blue-100 text-blue-600'
                              : role === 'project_manager'
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {getRoleLabel(role as any).slice(0, 1)}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {getRoleLabel(role as any)}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto font-medium tabular-nums">
                          {items.length} 件
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {items.slice(0, 3).map((c) => (
                          <ConsultationRow
                            key={c.id}
                            item={c}
                            onSelect={onSelectConsultation}
                          />
                        ))}
                        {items.length > 3 && (
                          <div className="text-xs text-gray-400 text-center py-2 bg-gray-50/30">
                            还有 {items.length - 3} 件待处理...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-white">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">咨询受理卡在哪里？</div>
              <div className="text-xs text-gray-500">退回、补录、超期等卡滞事项</div>
            </div>
            {stuckItems.length > 0 && (
              <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {stuckItems.length} 件
              </span>
            )}
          </div>
          <div className="p-2 max-h-80 overflow-auto">
            {stuckItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-300" />
                <p>无卡滞咨询</p>
                <p className="mt-1 opacity-70">所有咨询流程正常</p>
              </div>
            ) : (
              <div className="space-y-1">
                {rejectedConsultations.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 px-2 mb-1">
                      <RotateCcw size={12} className="text-red-500" />
                      <span className="text-xs font-medium text-red-600">
                        已退回 ({rejectedConsultations.length})
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {rejectedConsultations.slice(0, 4).map((c) => (
                        <ConsultationRow
                          key={`rejected-${c.id}`}
                          item={c}
                          reason={c.rejectReason}
                          reasonLabel="退回原因"
                          onSelect={onSelectConsultation}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {overdueConsultations.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 px-2 mb-1">
                      <Clock size={12} className="text-orange-500" />
                      <span className="text-xs font-medium text-orange-600">
                        已超期 ({overdueConsultations.length})
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {overdueConsultations.slice(0, 4).map((c) => (
                        <ConsultationRow
                          key={`overdue-${c.id}`}
                          item={c}
                          reason={c.supplementReason || '超过截止日期'}
                          reasonLabel="卡滞原因"
                          onSelect={onSelectConsultation}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {stuckItems.length > 8 && (
                  <div className="text-xs text-gray-400 text-center py-2">
                    还有 {stuckItems.length - 8} 件卡滞...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-white">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileCheck size={16} className="text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">资料清单为什么没完成？</div>
              <div className="text-xs text-gray-500">不完整资料及原因追踪</div>
            </div>
            {incompleteDocConsultations.length > 0 && (
              <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {incompleteDocConsultations.length} 项
              </span>
            )}
          </div>
          <div className="p-2 max-h-80 overflow-auto">
            {incompleteDocConsultations.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-300" />
                <p>所有资料清单已完成</p>
                <p className="mt-1 opacity-70">无未完成资料项</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incompleteDocConsultations.slice(0, 5).map((detail) => (
                  <div key={detail.consultation.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <DocProgressRow
                      detail={detail}
                      onSelect={onSelectConsultation}
                    />
                  </div>
                ))}
                {incompleteDocConsultations.length > 5 && (
                  <div className="text-xs text-gray-400 text-center py-2">
                    还有 {incompleteDocConsultations.length - 5} 个咨询资料未完成...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">主流程状态分布</span>
          <span className="text-xs text-gray-400">共 {totalConsultations} 条咨询</span>
        </div>
        <div className="flex items-stretch gap-1">
          {STATUS_CARDS.map(({ key, label, iconColor }) => {
            const count = dashboardStats[key];
            const pct = totalConsultations > 0 ? Math.round((count / totalConsultations) * 100) : 0;
            return (
              <div
                key={key}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${label}: ${count} (${pct}%)`}
              >
                <div className="w-full bg-gray-100 rounded-t h-16 flex items-end overflow-hidden">
                  <div
                    className={`w-full ${iconColor.replace('text-', 'bg-')} opacity-70 rounded-t transition-all`}
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-gray-700">{label}</div>
                <div className="text-xs text-gray-400 tabular-nums">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
