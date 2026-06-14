import { Phone, Mail, Video, CheckCircle, MoreHorizontal } from 'lucide-react';
import type { Communication } from '../types';

interface CommunicationQuickActionsProps {
  communication: Communication;
  onAction: (action: string, communication: Communication) => void;
}

export function CommunicationQuickActions({ communication, onAction }: CommunicationQuickActionsProps) {
  const actions = [
    {
      id: 'call',
      label: '拨打电话',
      icon: <Phone className="w-4 h-4" />,
      color: 'bg-green-100 text-green-700 hover:bg-green-200',
      show: true,
    },
    {
      id: 'message',
      label: '发送消息',
      icon: <Mail className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      show: true,
    },
    {
      id: 'meeting',
      label: '预约面谈',
      icon: <Video className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      show: true,
    },
    {
      id: 'complete',
      label: '完成沟通',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      show: communication.status !== 'completed',
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
            onAction(action.id, communication);
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