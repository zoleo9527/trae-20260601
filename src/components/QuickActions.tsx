import { CheckCircle, AlertTriangle, Clock, MoreHorizontal } from 'lucide-react';
import type { Renewal } from '../types';

interface QuickActionsProps {
  renewal: Renewal;
  onAction: (action: string, renewal: Renewal) => void;
}

export function QuickActions({ renewal, onAction }: QuickActionsProps) {
  const actions = [
    {
      id: 'complete',
      label: '完成续费',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-100 text-green-700 hover:bg-green-200',
      show: renewal.status !== 'completed',
    },
    {
      id: 'risk',
      label: '标记风险',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-red-100 text-red-700 hover:bg-red-200',
      show: renewal.status !== 'risk',
    },
    {
      id: 'processing',
      label: '开始处理',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      show: renewal.status === 'pending',
    },
  ];

  const visibleActions = actions.filter(a => a.show);

  return (
    <div className="flex items-center gap-2">
      {visibleActions.slice(0, 2).map(action => (
        <button
          key={action.id}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAction(action.id, renewal);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${action.color}`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
      {visibleActions.length > 2 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}