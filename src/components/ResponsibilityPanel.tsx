import { User, MapPin, AlertCircle, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Claim } from '@/types';
import { ROLE_LABELS, STATUS_TEXT_COLORS } from '@/types';
import { formatDateTime } from '@/utils/workflow';

interface ResponsibilityPanelProps {
  claim: Claim;
}

export default function ResponsibilityPanel({ claim }: ResponsibilityPanelProps) {
  const { getResponsibilityInfo, handlers } = useAppStore();
  const responsibility = getResponsibilityInfo(claim.id);

  const stuckInfo = claim.workflowLogs.length > 0
    ? claim.workflowLogs[claim.workflowLogs.length - 1]
    : null;

  const lastHandler = stuckInfo
    ? handlers.find((h) => h.id === stuckInfo.handlerId)
    : null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-lg border-l-4 border-emerald-500 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <User className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">谁在处理</p>
            {responsibility.currentHandler ? (
              <>
                <div className="flex items-center gap-2">
                  <img
                    src={responsibility.currentHandler.avatar}
                    alt={responsibility.currentHandler.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="font-bold text-slate-800">
                    {responsibility.currentHandler.name}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {ROLE_LABELS[responsibility.currentHandler.role]}
                </p>
              </>
            ) : (
              <p className="font-bold text-slate-400">未分配</p>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>当前处理人：{claim.currentHandlerId}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-amber-500 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <MapPin className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">卡在哪里</p>
            <p className="font-bold text-slate-800">{responsibility.stuckPoint}</p>
            <p className={`mt-1 text-sm font-medium ${STATUS_TEXT_COLORS[claim.status]}`}>
              当前状态：{claim.status}
            </p>
            {stuckInfo && (
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                <span>
                  上次操作：{formatDateTime(stuckInfo.createdAt)}
                  {lastHandler && ` · ${lastHandler.name}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-red-500 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">为什么没完成</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {responsibility.reason || '暂无信息'}
            </p>
            {claim.urgeCount > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                <AlertCircle className="h-3 w-3" />
                已被催办 {claim.urgeCount} 次
              </div>
            )}
            {stuckInfo && (
              <div className="mt-2 text-xs text-slate-400">
                已停留 {stuckInfo.durationHours.toFixed(1)} 小时
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
