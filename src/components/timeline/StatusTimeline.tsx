import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Send, FileText, ShoppingBag, Clock } from 'lucide-react';
import type { Promotion } from '@/types';
import { ROLE_LABELS, STATUS_LABELS } from '@/types';
import { formatRelativeTime, formatDateTime } from '@/utils/format';

interface StatusTimelineProps {
  promotions: Promotion[];
  maxItems?: number;
}

const actionIcons: Record<string, React.ElementType> = {
  create: FileText,
  submit: Send,
  approve: CheckCircle,
  reject: XCircle,
  complete: ShoppingBag,
};

const actionColors: Record<string, string> = {
  create: 'bg-slate-400',
  submit: 'bg-amber-500',
  approve: 'bg-emerald-500',
  reject: 'bg-red-500',
  complete: 'bg-purple-500',
};

const actionLabels: Record<string, string> = {
  create: '创建',
  submit: '提交',
  approve: '通过',
  reject: '驳回',
  complete: '完成',
};

export function StatusTimeline({ promotions, maxItems = 10 }: StatusTimelineProps) {
  const events = promotions
    .flatMap(p => 
      p.steps.map(step => ({
        ...step,
        promotion: p,
        title: p.title,
        status: p.status,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock size={32} className="mx-auto mb-2 text-slate-300" />
        <p>暂无状态变化</p>
      </div>
    );
  }

  return (
    <div className="relative pl-4">
      <div className="timeline-line" />
      <div className="space-y-6">
        {events.map((event, index) => {
          const Icon = actionIcons[event.action] || FileText;
          return (
            <div 
              key={`${event.id}-${index}`} 
              className="relative animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`timeline-dot ${actionColors[event.action]} top-1.5`} />
              
              <div className="ml-10">
                <Link 
                  to={`/promotion/${event.promotionId}`}
                  className="group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-navy-500 group-hover:text-amber-600 transition-colors">
                      {event.title}
                    </span>
                    <span className={`badge status-badge-${event.status} text-[10px] py-0`}>
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                      <span className={`badge role-badge-${event.role} text-[10px] py-0 mr-1`}>
                        {ROLE_LABELS[event.role]}
                      </span>
                      {event.operator}
                      <span className="mx-1 text-slate-400">·</span>
                      <span className="font-medium">{actionLabels[event.action]}</span>
                      {event.comment && (
                        <span className="text-slate-500">：{event.comment}</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    {formatDateTime(event.createdAt)}
                    <span className="mx-1">·</span>
                    {formatRelativeTime(event.createdAt)}
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
