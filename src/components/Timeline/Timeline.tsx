import { TimelineEvent } from '@/types';
import { formatDateTime } from '@/utils/date';
import { formatTimelineEventType } from '@/utils/format';
import { useUserStore } from '@/store/useUserStore';
import {
  FilePlus,
  Stethoscope,
  Home,
  Package,
  Heart,
  CheckCircle,
  Archive,
  RotateCcw,
  Edit3,
  Phone,
} from 'lucide-react';

const iconMap = {
  FilePlus,
  Stethoscope,
  Home,
  Package,
  Heart,
  CheckCircle,
  Archive,
  RotateCcw,
  Edit3,
  Phone,
};

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  const getUserName = useUserStore((state) => state.getUserName);

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const typeInfo = formatTimelineEventType(event.type);
        const IconComponent = iconMap[typeInfo.icon as keyof typeof iconMap] || FilePlus;
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4">
            {!isLast && (
              <div className="absolute left-[15px] top-8 w-0.5 h-full bg-warm-200" />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
              <IconComponent className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-warm-800">{event.title}</h4>
                <span className="text-xs text-warm-500">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
              <p className="text-sm text-warm-600 mb-1">{event.description}</p>
              <p className="text-xs text-warm-400">操作人：{getUserName(event.operator)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
