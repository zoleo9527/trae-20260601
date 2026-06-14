import { Calendar, User, FileText, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Application } from '../types';
import { StatusBadge } from './StatusBadge';
import { cn } from '../lib/utils';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
  selected?: boolean;
}

const statusBarConfig: Record<string, { bar: string; dot: string }> = {
  pending: { bar: 'bg-blue-500', dot: 'status-dot status-dot-pending' },
  correction: { bar: 'bg-amber-500', dot: 'status-dot status-dot-correction' },
  approved: { bar: 'bg-emerald-500', dot: 'status-dot status-dot-approved' },
  rejected: { bar: 'bg-red-500', dot: 'status-dot status-dot-rejected' },
  archived: { bar: 'bg-slate-300', dot: 'status-dot status-dot-archived' },
};

export function ApplicationCard({
  application,
  onClick,
  selected = false,
}: ApplicationCardProps) {
  const config = statusBarConfig[application.status] || statusBarConfig.archived;
  const hasCorrection = application.correctionNotices.length > 0;
  const hasMissing = application.materials.some(m => m.status === 'missing' || m.status === 'incorrect');
  const hasException = !!application.exceptionNote;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex items-stretch bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group',
        selected
          ? 'border-blue-300 shadow-card-active ring-2 ring-blue-100'
          : 'border-[var(--border-subtle)] shadow-card hover:shadow-card-hover hover:-translate-y-0.5'
      )}
    >
      <div className={cn('w-1 flex-shrink-0 rounded-l-xl', config.bar)} />

      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={config.dot} />
            <span className="text-sm font-mono font-semibold text-slate-700 tracking-tight">
              {application.appointmentNo}
            </span>
          </div>
          <StatusBadge status={application.status} size="sm" />
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-sm text-slate-800">
              {application.applicantName}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {application.applicantPhone}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-slate-50 text-slate-600 rounded border border-slate-100">
            {application.applicationType}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{application.receivedAt}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{application.windowNo}</span>
          </div>
        </div>

        {(hasCorrection || hasMissing || hasException) && (
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-50">
            {hasCorrection && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 rounded border border-amber-100">
                <FileText className="w-3 h-3" />
                补正 {application.correctionNotices.length} 次
              </span>
            )}
            {hasMissing && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-600 rounded border border-red-100">
                材料待补
              </span>
            )}
            {hasException && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-orange-50 text-orange-600 rounded border border-orange-100">
                <AlertTriangle className="w-3 h-3" />
                异常
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center w-10 border-l border-slate-50 bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors">
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </div>
  );
}
