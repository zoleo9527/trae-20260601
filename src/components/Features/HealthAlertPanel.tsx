import { AlertTriangle, Pill, Heart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HealthAlert, Child } from '@/types';

interface HealthAlertPanelProps {
  healthAlerts: HealthAlert[];
  children?: Child[];
  onDismiss?: (alertId: string) => void;
}

const alertTypeConfig = {
  allergy: {
    icon: AlertTriangle,
    label: '过敏提醒',
    bgColor: 'bg-warning-50',
    borderColor: 'border-warning-300',
    iconColor: 'text-warning-500',
    badgeColor: 'bg-warning-100 text-warning-700',
  },
  medication: {
    icon: Pill,
    label: '用药提醒',
    bgColor: 'bg-info-50',
    borderColor: 'border-info-300',
    iconColor: 'text-info-500',
    badgeColor: 'bg-info-100 text-info-700',
  },
  special: {
    icon: Heart,
    label: '特殊关注',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-300',
    iconColor: 'text-primary-500',
    badgeColor: 'bg-primary-100 text-primary-700',
  },
};

export default function HealthAlertPanel({
  healthAlerts,
  children,
  onDismiss,
}: HealthAlertPanelProps) {
  const activeAlerts = healthAlerts.filter((alert) => alert.isActive);

  if (activeAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Heart className="w-12 h-12 mb-2 opacity-50" />
        <p className="text-sm">暂无健康提醒</p>
      </div>
    );
  }

  const getChildName = (childId: string) => {
    return children?.find((c) => c.id === childId)?.name || '';
  };

  return (
    <div className="space-y-3">
      {activeAlerts.map((alert) => {
        const config = alertTypeConfig[alert.type];
        const Icon = config.icon;
        const childName = getChildName(alert.childId);

        return (
          <div
            key={alert.id}
            className={cn(
              'relative rounded-2xl border p-4 transition-all duration-300 hover:shadow-soft',
              config.bgColor,
              config.borderColor
            )}
          >
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}

            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                  config.badgeColor
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      config.badgeColor
                    )}
                  >
                    {config.label}
                  </span>
                  {childName && (
                    <span className="text-xs text-gray-500">
                      {childName}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {alert.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
