import { ROLE_LABELS } from '../types';
import type { FillingScheduleHistory, PackagingRequisitionHistory } from '../types';

interface Props {
  history: (FillingScheduleHistory | PackagingRequisitionHistory)[];
}

export default function Timeline({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无历史记录
      </div>
    );
  }

  const getActionColor = (action: string) => {
    if (action.includes('驳回') || action.includes('退回')) return 'bg-red-500';
    if (action.includes('通过') || action.includes('完成')) return 'bg-green-500';
    if (action.includes('提交') || action.includes('重提')) return 'bg-yellow-500';
    if (action.includes('发放') || action.includes('开始')) return 'bg-blue-500';
    if (action.includes('变更') || action.includes('提醒')) return 'bg-orange-500';
    if (action.includes('备注')) return 'bg-gray-400';
    return 'bg-gray-300';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatChanges = (changes: Record<string, any> | undefined) => {
    if (!changes) return null;
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
        <div className="text-gray-500 font-medium">变更内容：</div>
        {Object.entries(changes).map(([key, value]: [string, any]) => (
          <div key={key} className="flex items-center space-x-2">
            <span className="text-gray-600">{key}:</span>
            <span className="text-red-600 line-through">{String(value.old)}</span>
            <span className="text-gray-400">→</span>
            <span className="text-green-600 font-medium">{String(value.new)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={item.id} className="flex space-x-4">
          <div className="flex flex-col items-center">
            <div className={`timeline-dot ${getActionColor(item.action)}`} />
            {index < history.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 my-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{item.action}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {item.createdBy.avatar} {item.createdBy.name}
              </span>
              <span className="text-xs text-gray-400">
                {ROLE_LABELS[item.createdBy.role]}
              </span>
              {('scheduleChangeNotified' in item) && item.scheduleChangeNotified && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                  ⚠️ 排产变更提醒
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(item.createdAt)}
            </div>
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{item.remark}</p>
            {formatChanges(item.changes)}
          </div>
        </div>
      ))}
    </div>
  );
}
