import { HistoryRecord, RescueStatus } from '@/types';
import { Clock, User, PawPrint, Stethoscope, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import StatusBadge from './StatusBadge';
import { Role } from '@/store';

interface TimelineProps {
  records: HistoryRecord[];
}

export default function Timeline({ records }: TimelineProps) {
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.VOLUNTEER:
        return PawPrint;
      case Role.VET:
        return Stethoscope;
      case Role.ADOPTION_REVIEWER:
        return ClipboardCheck;
      default:
        return User;
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.VOLUNTEER:
        return '救助志愿者';
      case Role.VET:
        return '兽医';
      case Role.ADOPTION_REVIEWER:
        return '领养审核员';
      default:
        return '用户';
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock size={48} className="mx-auto mb-3 text-gray-300" />
        <p>暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {records.map((record) => {
          const Icon = getRoleIcon(record.role);
          return (
            <div key={record.id} className="relative pl-10">
              <div className="absolute left-0 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                <Icon size={16} className="text-gray-600" />
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{record.action}</span>
                    {(record.fromStatus || record.toStatus) && (
                      <div className="flex items-center gap-2 mt-1">
                        {record.fromStatus && (
                          <>
                            <StatusBadge status={record.fromStatus as RescueStatus} type="rescue" />
                            <span className="text-gray-400">→</span>
                          </>
                        )}
                        {record.toStatus && <StatusBadge status={record.toStatus as RescueStatus} type="rescue" />}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    {format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </span>
                </div>
                {record.note && (
                  <p className="text-sm text-gray-600 mb-2">{record.note}</p>
                )}
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <User size={12} />
                  {record.operator} · {getRoleLabel(record.role)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
