import type { Remark } from '../types';
import { remarkTypeLabels, roleLabels } from '../types';
import { User, Clock, MessageSquare } from 'lucide-react';

interface RemarkBubbleProps {
  remark: Remark;
}

export function RemarkBubble({ remark }: RemarkBubbleProps) {
  const typeStyles: Record<Remark['type'], string> = {
    dispatch: 'bg-primary-50/50 border-primary-200 border-l-4 border-l-primary-500',
    onsite: 'bg-warning-50/50 border-warning-200 border-l-4 border-l-warning-500',
    return: 'bg-danger-50/50 border-danger-200 border-l-4 border-l-danger-500',
    supplement: 'bg-neutral-50 border-neutral-200 border-l-4 border-l-neutral-400',
  };

  const typeBadgeStyles: Record<Remark['type'], string> = {
    dispatch: 'bg-primary-100 text-primary-700',
    onsite: 'bg-warning-100 text-warning-700',
    return: 'bg-danger-100 text-danger-700',
    supplement: 'bg-neutral-100 text-neutral-600',
  };

  const avatarColors: Record<Remark['type'], string> = {
    dispatch: 'bg-primary-100 text-primary-600',
    onsite: 'bg-warning-100 text-warning-600',
    return: 'bg-danger-100 text-danger-600',
    supplement: 'bg-neutral-100 text-neutral-600',
  };

  return (
    <div
      className={`p-4 rounded-lg border ${typeStyles[remark.type]} transition-all duration-200 hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-full ${avatarColors[remark.type]} flex items-center justify-center flex-shrink-0`}
        >
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-neutral-800">
                {remark.authorName}
              </span>
              <span className="text-xs text-neutral-500">
                ({roleLabels[remark.authorRole]})
              </span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${typeBadgeStyles[remark.type]}`}
            >
              {remarkTypeLabels[remark.type]}
            </span>
          </div>
          <p className="text-sm text-neutral-700 leading-relaxed mb-2">
            {remark.content}
          </p>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Clock className="w-3 h-3" />
            <span>{remark.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
