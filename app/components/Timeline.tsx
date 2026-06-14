import type { TimelineEvent, OperationRecord } from '~/types';
import { formatDate, getEventIcon, getStatusLabel, getRoleLabel } from '~/utils/formatters';

interface TimelineProps {
  events: TimelineEvent[];
  operationRecords?: OperationRecord[];
  showDetails?: boolean;
}

export default function Timeline({ events, operationRecords = [], showDetails = false }: TimelineProps) {
  const allEvents = [
    ...events.map(e => ({ ...e, type: 'event' as const })),
    ...operationRecords.map(or => ({ ...or, type: 'operation' as const }))
  ].sort((a, b) => {
    const dateA = 'createdAt' in a ? new Date(a.createdAt).getTime() : 0;
    const dateB = 'createdAt' in b ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      <div className="space-y-4">
        {allEvents.map((item, index) => (
          <div key={'id' in item ? item.id : index} className="relative flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10">
              <span className="text-sm">
                {'type' in item && item.type === 'event' 
                  ? getEventIcon((item as TimelineEvent).type)
                  : 'type' in item && item.type === 'operation'
                  ? getEventIcon((item as OperationRecord).type)
                  : '📌'
                }
              </span>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">
                      {'title' in item ? (item as TimelineEvent).title : (item as OperationRecord).action}
                    </h3>
                    {'actorRole' in item && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        getRoleColor((item as OperationRecord).actorRole)
                      }`}>
                        {getRoleLabel((item as OperationRecord).actorRole)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {'description' in item ? (item as TimelineEvent).description : (item as OperationRecord).note}
                  </p>
                  
                  {showDetails && 'metadata' in item && item.metadata && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(item.metadata, null, 2)}</pre>
                    </div>
                  )}

                  {'previousValue' in item && (
                    <div className="mt-2 flex items-center space-x-2 text-xs">
                      <span className="text-gray-500">
                        {getStatusLabel((item as OperationRecord).previousValue || '无')} 
                        <span className="mx-1">→</span> 
                        {getStatusLabel((item as OperationRecord).newValue || '无')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(new Date(item.createdAt))}
                  </div>
                  {'actorName' in item && (
                    <div className="text-xs text-blue-600 mt-1">
                      {(item as TimelineEvent).actorName || (item as OperationRecord).actorName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    manager: 'bg-purple-100 text-purple-800',
    assessor: 'bg-blue-100 text-blue-800',
    finance: 'bg-green-100 text-green-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}
