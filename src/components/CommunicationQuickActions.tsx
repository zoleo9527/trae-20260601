import { useState } from 'react';
import { Phone, Mail, Video, CheckCircle, MoreHorizontal, X } from 'lucide-react';
import type { Communication } from '../types';

interface CommunicationQuickActionsProps {
  communication: Communication;
  onAction: (action: string, communication: Communication, result?: string) => void;
}

export function CommunicationQuickActions({ communication, onAction }: CommunicationQuickActionsProps) {
  const [showMore, setShowMore] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [resultText, setResultText] = useState('');

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
  const primaryActions = visibleActions.slice(0, 2);
  const moreActions = visibleActions.slice(2);

  const handleAction = (actionId: string) => {
    if (actionId === 'complete') {
      setShowCompleteModal(true);
    } else {
      onAction(actionId, communication);
      setShowMore(false);
    }
  };

  const handleComplete = () => {
    if (resultText.trim()) {
      onAction('complete', communication, resultText.trim());
      setShowCompleteModal(false);
      setShowMore(false);
      setResultText('');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {primaryActions.map(action => (
          <button
            key={action.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAction(action.id);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${action.color}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
        {moreActions.length > 0 && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMore(!showMore);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              {showMore ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
            </button>
            
            {showMore && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-2 min-w-[120px]">
                {moreActions.map(action => (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAction(action.id);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm font-medium transition-colors ${action.color.replace('hover:', '')}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowCompleteModal(false)}
          />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">完成沟通</h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
                <textarea
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="请输入本次沟通的处理结果..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!resultText.trim()}
                  className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}