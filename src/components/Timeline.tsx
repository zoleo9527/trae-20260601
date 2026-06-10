import React from 'react';
import {
  FileCheck,
  FileX,
  Radio,
  RadioTower,
  AlertTriangle,
  Wrench,
  User,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { ActivityItem } from '../data/types';
import { timeAgo } from '../utils/date';
import { getOperatorRoleLabel } from '../data/mockData';

interface TimelineProps {
  items: ActivityItem[];
  maxItems?: number;
  className?: string;
}

export function Timeline({ items, maxItems = 10, className }: TimelineProps) {
  const displayItems = items.slice(0, maxItems);

  const getIcon = (type: ActivityItem['type']) => {
    const icons: Record<ActivityItem['type'], React.ReactNode> = {
      audit_pass: <FileCheck className="w-4 h-4" />,
      audit_reject: <FileX className="w-4 h-4" />,
      dispatch_success: <Radio className="w-4 h-4" />,
      dispatch_fail: <RadioTower className="w-4 h-4" />,
      exception_fix: <Wrench className="w-4 h-4" />,
      exception_create: <AlertTriangle className="w-4 h-4" />,
    };
    return icons[type];
  };

  const getIconStyles = (type: ActivityItem['type']) => {
    const styles: Record<ActivityItem['type'], string> = {
      audit_pass: 'bg-emerald-100 text-emerald-600',
      audit_reject: 'bg-red-100 text-red-600',
      dispatch_success: 'bg-blue-100 text-blue-600',
      dispatch_fail: 'bg-red-100 text-red-600',
      exception_fix: 'bg-emerald-100 text-emerald-600',
      exception_create: 'bg-amber-100 text-amber-600',
    };
    return styles[type];
  };

  return (
    <div className={cn('space-y-1', className)}>
      {displayItems.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'flex gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer animate-fade-in',
            index === 0 && 'bg-orange-50/50'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                getIconStyles(item.type)
              )}
            >
              {getIcon(item.type)}
            </div>
            {index < displayItems.length - 1 && (
              <div className="absolute top-8 left-1/2 w-px h-full bg-slate-200 -translate-x-1/2" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm text-slate-800 truncate">
                {item.title}
              </span>
              <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono">
                {timeAgo(item.timestamp)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <User className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-400">
                {item.operatorName}
                <span className="text-slate-300 mx-1">·</span>
                {getOperatorRoleLabel(item.operatorRole)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
