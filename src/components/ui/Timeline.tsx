import React from 'react';
import type { TimelineEvent, TimelineEventType } from '@/types';
import {
  ClipboardList,
  UserPlus,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Phone,
  MessageSquare,
  Undo2,
  Bell,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { ROLE_LABEL } from '@/types';

const iconMap: Record<TimelineEventType, { icon: typeof ClipboardList; tone: string }> = {
  register: { icon: ClipboardList, tone: 'bg-sky-100 text-sky-600' },
  assign: { icon: UserPlus, tone: 'bg-violet-100 text-violet-600' },
  update: { icon: Edit3, tone: 'bg-slate-100 text-slate-600' },
  escalate: { icon: TrendingUp, tone: 'bg-red-100 text-red-600' },
  verify: { icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-600' },
  reject: { icon: XCircle, tone: 'bg-orange-100 text-orange-600' },
  resolve: { icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-600' },
  visit_start: { icon: Phone, tone: 'bg-bank-100 text-bank-600' },
  visit_result: { icon: MessageSquare, tone: 'bg-bank-100 text-bank-600' },
  return: { icon: Undo2, tone: 'bg-orange-100 text-orange-600' },
  reminder: { icon: Bell, tone: 'bg-amber-100 text-amber-600' },
};

export const Timeline: React.FC<{ events: TimelineEvent[] }> = ({ events }) => {
  const sorted = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ol className="relative space-y-5 pl-1.5">
      <span className="absolute left-[17px] top-1 bottom-1 w-px bg-slate-200" />
      {sorted.map((ev) => {
        const meta = iconMap[ev.type] ?? iconMap.update;
        const Icon = meta.icon;
        const isAbnormal = ev.detail && (ev.detail as { abnormal?: boolean }).abnormal;
        return (
          <li key={ev.id} className="relative flex gap-3">
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                meta.tone,
                isAbnormal && 'bg-red-100 text-red-600 animate-pulse',
              )}
            >
              <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{ev.operatorName}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                  {ROLE_LABEL[ev.operatorRole]}
                </span>
                {isAbnormal && (
                  <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
                    <AlertTriangle size={10} />
                    异常提醒
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400">{formatDateTime(ev.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{ev.content}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
