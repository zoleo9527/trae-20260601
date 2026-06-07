import { AlertTriangle, X, Check, Clock } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Alert } from '@/types';
import { getAlertTypeText, getAlertPriorityColor, formatDate, getRoleText } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AlertBannerProps {
  alert: Alert;
  onAcknowledge?: () => void;
  onResolve?: () => void;
}

export function AlertBanner({ alert, onAcknowledge, onResolve }: AlertBannerProps) {
  const priorityColor = getAlertPriorityColor(alert.priority);
  
  return (
    <div className={cn(
      'border-l-4 bg-white shadow-sm rounded-r-lg p-4 mb-3',
      alert.status === 'active' ? 'border-red-500' : 'border-yellow-500'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('w-2 h-2 rounded-full mt-2', priorityColor)} />
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                'w-4 h-4',
                alert.status === 'active' ? 'text-red-500' : 'text-yellow-500'
              )} />
              <h4 className="font-medium text-gray-900">{alert.title}</h4>
              {alert.assignedRole && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {getRoleText(alert.assignedRole)}处理
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(alert.createdAt)}
              </span>
              <span>{getAlertTypeText(alert.type)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alert.status === 'active' && onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              确认
            </button>
          )}
          {onResolve && (
            <button
              onClick={onResolve}
              className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              解决
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
